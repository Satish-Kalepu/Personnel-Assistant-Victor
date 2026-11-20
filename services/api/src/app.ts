import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { toNodeHandler } from "better-auth/node";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { Config } from "./config.js";
import type { Store } from "./store.js";
import { createMailer } from "./mail.js";
import { createIdentity } from "./auth.js";
import { createUsage } from "./usage.js";
import { createAssistant, type Tenant } from "./assistant.js";
import { createModel, type Model } from "./model.js";
import { AppError, passwordSchema, modeSchema, idSchema } from "./errors.js";
import { checkOrigin, headersOf, rateLimit } from "./security.js";
export function createApplication(
  store: Store,
  config: Config,
  model: Model = createModel(config),
) {
  const app = express(),
    mail = createMailer(store, config),
    identity = createIdentity(store, config, mail),
    usage = createUsage(store, config),
    assistant = createAssistant(store, usage, model);
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    next();
  });
  app.get("/health/live", (_req, res) => res.json({ status: "ok" }));
  app.get("/health/ready", async (_req, res) => {
    try {
      await Promise.all([store.db.command({ ping: 1 }), store.redis.ping()]);
      res.json({ status: "ready" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });
  app.use(async (req, _res, next) => {
    try {
      checkOrigin(req, config);
      await rateLimit(
        store,
        config.AUTH_SECRET,
        "http",
        req.ip || "unknown",
        180,
        60,
      );
      if (
        req.path.startsWith("/api/auth/") ||
        req.path.startsWith("/api/account/")
      )
        await rateLimit(
          store,
          config.AUTH_SECRET,
          "auth-ip",
          req.ip || "unknown",
          30,
          60,
        );
      // Native clients have no browser Origin; preserve a supplied browser
      // Origin for validation, and bridge only the explicit native API mode.
      if (!req.get("origin") && req.get("x-victor-client") === "android")
        req.headers.origin = config.APP_ORIGIN;
      next();
    } catch (error) {
      next(error);
    }
  });
  const allowedAuth = new Map([
    ["/api/auth/sign-in/email", "POST"],
    ["/api/auth/sign-out", "POST"],
    ["/api/auth/get-session", "GET"],
  ]);
  app.all("/api/auth/*splat", (req, res, next) => {
    if (allowedAuth.get(req.path) !== req.method)
      return next(new AppError(404, "not_found", "Route not found."));
    return toNodeHandler(identity.auth)(req, res);
  });
  app.use(express.json({ limit: "32kb", strict: true }));
  const post = (
    path: string,
    handler: (body: unknown, request: Request) => Promise<unknown>,
  ) =>
    app.post(path, async (req, res) => {
      res.json(await handler(req.body, req));
    });
  post("/api/account/register", (body) => identity.register(body));
  post("/api/account/verify-registration", (body) =>
    identity.verifyRegistration(body),
  );
  post("/api/account/forgot-password", (body) => identity.forgot(body));
  post("/api/account/reset-password", (body) => identity.reset(body));
  post("/api/account/recover", (body) => identity.recover(body));
  async function tenant(req: Request): Promise<Tenant> {
    const active = await identity.auth.api.getSession({
      headers: headersOf(req),
    });
    if (!active?.user.emailVerified)
      throw new AppError(401, "unauthorized", "Sign in to continue.");
    return Object.freeze({ id: active.user.id });
  }
  app.get("/api/me", async (req, res) => {
    const user = await tenant(req),
      active = await identity.auth.api.getSession({ headers: headersOf(req) });
    res.json({
      user: { id: user.id, name: active!.user.name, email: active!.user.email },
      usage: await usage.status(user.id),
      providers: {
        chat: !!config.OPENAI_API_KEY,
        voice:
          !!config.SARVAM_API_KEY && config.SARVAM_PRIVACY_CONFIRMED === "true",
      },
    });
  });
  app.post("/api/account/change-password", async (req, res) => {
    await tenant(req);
    const body = z
      .object({
        currentPassword: z.string().max(128),
        newPassword: passwordSchema,
      })
      .strict()
      .parse(req.body);
    const result = await identity.auth.api.changePassword({
      headers: headersOf(req),
      body: { ...body, revokeOtherSessions: true },
      asResponse: true,
    });
    for (const cookie of result.headers.getSetCookie())
      res.append("Set-Cookie", cookie);
    const token = result.headers.get("set-auth-token");
    if (token) res.set("set-auth-token", token);
    res.status(result.status).json(await result.json());
    if (result.ok) {
      const active = await identity.auth.api.getSession({
        headers: headersOf(req),
      });
      if (active)
        await mail.queue(
          active.user.email,
          "Your Victor password changed",
          "Your password changed. Other sessions were revoked. If this was not you, recover your account.",
        ).catch(()=>console.error(JSON.stringify({event:'password_notification_unavailable'})));
    }
  });
  app.post("/api/account/recovery-codes", async (req, res) => {
    const user = await tenant(req),
      { password } = z
        .object({ password: z.string().max(128) })
        .strict()
        .parse(req.body);
    await identity.auth.api.verifyPassword({
      headers: headersOf(req),
      body: { password },
    });
    res.json({ recoveryCodes: await identity.recoveryCodes(user.id) });
  });
  app.post("/api/chat", async (req, res) => {
    const user = await tenant(req);
    res.json(await assistant.chat(user, req.body));
  });
  app.get("/api/messages", async (req, res) =>
    res.json(await assistant.history(await tenant(req), req.query)),
  );
  app.get("/api/facts", async (req, res) =>
    res.json(await assistant.listFacts(await tenant(req), req.query)),
  );
  app.patch("/api/facts/:id", async (req, res) =>
    res.json(
      await assistant.updateFact(
        await tenant(req),
        String(req.params.id),
        req.body,
      ),
    ),
  );
  app.delete("/api/facts/:id", async (req, res) =>
    res.json(
      await assistant.deleteFact(await tenant(req), String(req.params.id)),
    ),
  );
  app.get("/api/conversations", async (req, res) => {
    const user = await tenant(req),
      { mode, cursor } = z
        .object({ mode: modeSchema, cursor: idSchema.optional() })
        .strict()
        .parse(req.query),
      collection = store.db.collection<any>("conversations");
    const filter: any = { tenantId: user.id, mode };
    if (cursor) {
      const anchor = await collection.findOne({ ...filter, _id: cursor });
      if (!anchor)
        throw new AppError(400, "cursor", "Invalid conversation cursor.");
      filter.$or = [
        { updatedAt: { $lt: anchor.updatedAt } },
        { updatedAt: anchor.updatedAt, _id: { $lt: cursor } },
      ];
    }
    const records = await collection
        .find(filter)
        .sort({ updatedAt: -1, _id: -1 })
        .limit(101)
        .toArray(),
      page = records.slice(0, 100);
    res.json({
      conversations: page.map(({ _id, mode, createdAt, updatedAt }) => ({
        id: _id,
        mode,
        createdAt,
        updatedAt,
      })),
      nextCursor: records.length > 100 ? page.at(-1)._id : null,
    });
  });
  app.post("/api/conversations", async (req, res) => {
    const { mode } = z.object({ mode: modeSchema }).strict().parse(req.body);
    res.json({
      conversationId: await assistant.createConversation(
        await tenant(req),
        mode,
      ),
    });
  });
  app.delete("/api/conversations/:id", async (req, res) => {
    const { mode } = z.object({ mode: modeSchema }).strict().parse(req.query);
    res.json(
      await assistant.deleteConversation(
        await tenant(req),
        mode,
        idSchema.parse(req.params.id),
      ),
    );
  });
  app.get("/api/voice/config", async (req, res) => {
    await tenant(req);
    if (
      !config.OPENAI_API_KEY ||
      !config.SARVAM_API_KEY ||
      config.SARVAM_PRIVACY_CONFIRMED !== "true"
    )
      throw new AppError(
        503,
        "voice_unavailable",
        "Voice needs configured AI providers.",
      );
    const origin = new URL(config.APP_ORIGIN);
    origin.protocol = origin.protocol === "https:" ? "wss:" : "ws:";
    origin.pathname = "/voice";
    res.json({ gatewayUrl: origin.href });
  });
  app.use((_req, _res, next) =>
    next(new AppError(404, "not_found", "Route not found.")),
  );
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (res.headersSent) return;
      if (error instanceof AppError) {
        res
          .status(error.status)
          .json({ error: error.code, message: error.message });
        return;
      }
      if (
        error instanceof z.ZodError ||
        (error as any)?.type === "entity.parse.failed"
      ) {
        res
          .status(400)
          .json({
            error: "invalid_request",
            message: "Check the request fields and try again.",
          });
        return;
      }
      if (
        (error as any)?.statusCode >= 400 &&
        (error as any)?.statusCode < 500
      ) {
        res
          .status((error as any).statusCode)
          .json({
            error: "account_request",
            message:
              "Account request could not be completed. Check your details or request a new code.",
          });
        return;
      }
      const id = randomUUID();
      console.error(JSON.stringify({ event: "request_failed", id }));
      res
        .status(503)
        .json({
          error: "unavailable",
          message: "Service unavailable. Try again shortly.",
          requestId: id,
        });
    },
  );
  return { app, identity, assistant, usage, mail };
}
