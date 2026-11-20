import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";
import type { Config } from "./config.js";
import type { Store } from "./store.js";
import { seal, unseal, rateLimit } from "./security.js";
import { AppError } from "./errors.js";
export function createMailer(store: Store, config: Config) {
  const transport = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE === "true",
    requireTLS: config.NODE_ENV === "production",
    auth: config.SMTP_USER
      ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });
  let busy = false;
  async function queue(to: string, subject: string, text: string) {
    try { await rateLimit(store,config.AUTH_SECRET,'email-global',new Date().toISOString().slice(0,10),config.DAILY_EMAIL_LIMIT,86400); }
    catch(error) { if(error instanceof AppError && error.status===429){console.warn(JSON.stringify({event:'email_daily_limit'}));return false;}throw error; }
    await store.db
      .collection("outbox")
      .insertOne({
        payload: seal(config.MAIL_ENCRYPTION_KEY, { to, subject, text }),
        state: "pending",
        attempts: 0,
        nextAttemptAt: new Date(),
        expiresAt: new Date(Date.now() + 600000),
        messageId: `${randomUUID()}@victor`,
      });
    return true;
  }
  async function drain() {
    if (busy) return;
    busy = true;
    try {
      for (let i = 0; i < 10; i++) {
        const now = new Date();
        const job = await store.db
          .collection("outbox")
          .findOneAndUpdate(
            {
              state: { $in: ["pending", "sending"] },
              nextAttemptAt: { $lte: now },
              expiresAt: { $gt: now },
              attempts: { $lt: 5 },
            },
            {
              $set: {
                state: "sending",
                nextAttemptAt: new Date(Date.now() + 60000),
              },
              $inc: { attempts: 1 },
            },
            { returnDocument: "after", sort: { nextAttemptAt: 1 } },
          );
        if (!job) break;
        try {
          const mail = unseal<{ to: string; subject: string; text: string }>(
            config.MAIL_ENCRYPTION_KEY,
            job.payload,
          );
          await transport.sendMail({
            ...mail,
            from: config.SMTP_FROM,
            messageId: `<${job.messageId}>`,
          });
          await store.db.collection("outbox").deleteOne({ _id: job._id });
        } catch {
          await store.db
            .collection("outbox")
            .updateOne(
              { _id: job._id },
              {
                $set: {
                  state: "pending",
                  nextAttemptAt: new Date(
                    Date.now() + Math.min(300000, 5000 * 2 ** job.attempts),
                  ),
                },
              },
            );
        }
      }
    } finally {
      busy = false;
    }
  }
  const timer = setInterval(() => {
    drain().catch(() =>
      console.error(JSON.stringify({ event: "mail_worker_unavailable" })),
    );
  }, 1000);
  timer.unref();
  return {
    queue,
    drain,
    close() {
      clearInterval(timer);
      transport.close();
    },
  };
}
export type Mailer = ReturnType<typeof createMailer>;
