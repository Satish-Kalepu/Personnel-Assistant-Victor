import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes, randomInt } from "node:crypto";
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { z } from "zod";
import type { Config } from "./config.js";
import type { Store } from "./store.js";
import type { Mailer } from "./mail.js";
import { AppError, emailSchema, passwordSchema } from "./errors.js";
import { digest, equalDigest, seal, unseal, rateLimit } from "./security.js";

export function createIdentity(store: Store, config: Config, mail: Mailer) {
  const verifiedSignup = new AsyncLocalStorage<string>();
  async function issue(
    email: string,
    purpose: string,
    payload: unknown = null,
  ) {
    const code = String(randomInt(100000, 1000000));
    await store.db
      .collection("challenges")
      .updateOne(
        { email, purpose },
        {
          $set: {
            digest: digest(config.AUTH_SECRET, `${purpose}:${email}`, code),
            payload: seal(config.MAIL_ENCRYPTION_KEY, payload),
            expiresAt: new Date(Date.now() + 600000),
            attempts: 0,
            usedAt: null,
          },
        },
        { upsert: true },
      );
    await mail.queue(
      email,
      purpose === "registration"
        ? "Verify your Victor email"
        : "Reset your Victor password",
      `Your Victor code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
    );
  }
  async function consume(email: string, purpose: string, code: string) {
    const challenge = await store.db
      .collection("challenges")
      .findOneAndUpdate(
        {
          email,
          purpose,
          usedAt: null,
          expiresAt: { $gt: new Date() },
          attempts: { $lt: 5 },
        },
        { $inc: { attempts: 1 } },
        { returnDocument: "after" },
      );
    if (
      !challenge ||
      !equalDigest(
        challenge.digest,
        digest(config.AUTH_SECRET, `${purpose}:${email}`, code),
      )
    )
      throw new AppError(400, "invalid_code", "Code is invalid or expired.");
    const used = await store.db
      .collection("challenges")
      .findOneAndUpdate(
        {
          _id: challenge._id,
          digest: challenge.digest,
          usedAt: null,
          expiresAt: { $gt: new Date() },
        },
        { $set: { usedAt: new Date() }, $unset: { payload: "" } },
        { returnDocument: "before" },
      );
    if (!used)
      throw new AppError(400, "invalid_code", "Code is invalid or expired.");
    return unseal<any>(config.MAIL_ENCRYPTION_KEY, used.payload);
  }
  const auth = betterAuth({
    appName: "Victor",
    baseURL: config.APP_ORIGIN,
    basePath: "/api/auth",
    secret: config.AUTH_SECRET,
    database: mongodbAdapter(store.db, { client: store.mongo }),
    trustedOrigins: ["*"],
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      requireEmailVerification: true,
      minPasswordLength: 15,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 600,
      revokeSessionsOnPasswordReset: true,
      async sendResetPassword({ user, token }) {
        await issue(user.email, "reset", { token });
      },
      async onPasswordReset({ user }) {
        await mail.queue(
          user.email,
          "Your Victor password changed",
          "Your password was reset and existing sessions were revoked. If this was not you, recover your account immediately.",
        ).catch(()=>console.error(JSON.stringify({event:'password_notification_unavailable'})));
      },
    },
    emailVerification: {
      async sendVerificationEmail() {
        /* Registration is verified before account creation. */
      },
    },
    session: {
      expiresIn: 604800,
      updateAge: 86400,
      freshAge: 600,
      cookieCache: { enabled: false },
    },
    advanced: {
      // Explicit owner policy: allow browser authentication from every origin,
      // including cross-site Fetch Metadata requests and opaque/null origins.
      disableCSRFCheck: true,
      useSecureCookies: config.NODE_ENV === "production",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    },
    databaseHooks: {
      user: {
        create: {
          async before(user) {
            return verifiedSignup.getStore() === user.email
              ? { data: { ...user, emailVerified: true } }
              : false;
          },
        },
      },
    },
    plugins: [bearer({ requireSignature: true })],
    logger: { disabled: true },
    rateLimit: { enabled: true, window: 60, max: 30 },
  });
  async function limits(email: string, scope: string) {
    await rateLimit(store, config.AUTH_SECRET, scope, email, 5, 900);
  }
  async function recoveryCodes(tenantId: string) {
    const codes = Array.from({ length: 10 }, () =>
      randomBytes(16).toString("hex"),
    );
    await store.mongo.withSession(async (session) => {
      await session.withTransaction(async () => {
        await store.db
          .collection("recoveryCodes")
          .deleteMany({ tenantId }, { session });
        await store.db.collection("recoveryCodes").insertMany(
          codes.map((code) => ({
            tenantId,
            digest: digest(config.AUTH_SECRET, "recovery", code),
            usedAt: null,
          })),
          { session },
        );
      });
    });
    return codes;
  }
  async function register(body: unknown) {
    const { email } = z.object({ email: emailSchema }).strict().parse(body);
    await limits(email, "registration-mail");
    if (!(await store.db.collection("user").findOne({ email })))
      await issue(email, "registration");
    return {
      message:
        "If this address can be registered, a verification code has been sent.",
    };
  }
  async function verifyRegistration(body: unknown) {
    const { email, code, password, name } = z
      .object({
        email: emailSchema,
        code: z.string().regex(/^\d{6}$/),
        password: passwordSchema,
        name: z.string().trim().min(1).max(100),
      })
      .strict()
      .parse(body);
    await consume(email, "registration", code);
    if (await store.db.collection("user").findOne({ email }))
      throw new AppError(
        400,
        "registration_unavailable",
        "Unable to complete registration. Try signing in or recovering your account.",
      );
    const response = await verifiedSignup.run(email, () =>
      auth.api.signUpEmail({ body: { email, password, name } }),
    );
    return {
      message: "Email verified. Save your recovery codes, then sign in.",
      recoveryCodes: await recoveryCodes(response.user.id),
    };
  }
  async function forgot(body: unknown) {
    const { email } = z.object({ email: emailSchema }).strict().parse(body);
    await limits(email, "reset-mail");
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: config.APP_ORIGIN },
    });
    return {
      message:
        "If this account exists, a recovery code has been sent to its verified email.",
    };
  }
  async function reset(body: unknown) {
    const { email, code, password } = z
      .object({
        email: emailSchema,
        code: z.string().regex(/^\d{6}$/),
        password: passwordSchema,
      })
      .strict()
      .parse(body);
    const { token } = await consume(email, "reset", code);
    await auth.api.resetPassword({ body: { newPassword: password, token } });
    return { message: "Password reset. Sign in again on each device." };
  }
  async function recover(body: unknown) {
    const { email, code, password } = z
      .object({
        email: emailSchema,
        code: z.string().regex(/^[a-f0-9]{32}$/),
        password: passwordSchema,
      })
      .strict()
      .parse(body);
    await limits(email, "recovery-code");
    const user = await store.db
      .collection("user")
      .findOne({ email, emailVerified: true });
    if (!user)
      throw new AppError(
        400,
        "invalid_recovery",
        "Recovery details are invalid.",
      );
    const context = await auth.$context;
    const token = randomBytes(24).toString("hex");
    const consumed = await store.db
      .collection("recoveryCodes")
      .findOneAndUpdate(
        {
          tenantId: user._id.toString(),
          digest: digest(config.AUTH_SECRET, "recovery", code),
          usedAt: null,
        },
        { $set: { usedAt: new Date() } },
      );
    if (!consumed)
      throw new AppError(
        400,
        "invalid_recovery",
        "Recovery details are invalid.",
      );
    await context.internalAdapter.createVerificationValue({
      identifier: `reset-password:${token}`,
      value: user._id.toString(),
      expiresAt: new Date(Date.now() + 60000),
    });
    await auth.api.resetPassword({ body: { newPassword: password, token } });
    return {
      message:
        "Recovery code used. Password reset and existing sessions revoked. Sign in again.",
    };
  }
  return {
    auth,
    register,
    verifyRegistration,
    forgot,
    reset,
    recover,
    recoveryCodes,
  };
}
export type Identity = ReturnType<typeof createIdentity>;
