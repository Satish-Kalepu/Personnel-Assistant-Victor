import type { ClientSession } from "mongodb";
import { randomUUID } from "node:crypto";
import type { Config } from "./config.js";
import type { Store } from "./store.js";
import { AppError } from "./errors.js";
export function createUsage(store: Store, config: Config) {
  const records = store.db.collection("usage");
  const day = () => new Date().toISOString().slice(0, 10);
  const month = () => new Date().toISOString().slice(0, 7);
  async function add(
    tenantId: string,
    periodStart: string,
    metric: string,
    amount: number,
    limit: number,
    session: ClientSession,
  ) {
    const key = { tenantId, periodStart, metric };
    await records.updateOne(
      key,
      { $setOnInsert: { value: 0 } },
      { upsert: true, session },
    );
    const result = await records.updateOne(
      { ...key, value: { $lte: limit - amount } },
      { $inc: { value: amount } },
      { session },
    );
    if (!result.modifiedCount)
      throw new AppError(
        429,
        "usage_limit",
        "Usage limit reached. Check your daily allowance or the application budget.",
      );
  }
  async function reserveChat(tenantId: string) {
    await store.mongo.withSession(async (session) => {
      await session.withTransaction(async () => {
        await add(tenantId, day(), "chat", 1, config.DAILY_CHAT_LIMIT, session);
        await add(
          "__application",
          month(),
          "aiCents",
          config.CHAT_RESERVE_CENTS,
          config.MONTHLY_AI_LIMIT_CENTS,
          session,
        );
      });
    });
  }
  async function reserveSpeech(tenantId: string, chars: number) {
    await store.mongo.withSession(async (session) => {
      await session.withTransaction(async () => {
        await add(
          "__application",
          month(),
          "aiCents",
          Math.ceil(chars / 1000) * config.TTS_RESERVE_CENTS_PER_1000_CHARS,
          config.MONTHLY_AI_LIMIT_CENTS,
          session,
        );
      });
    });
  }
  async function reserveVoice(tenantId: string, leaseId: string) {
    let seconds = 0;
    const periodStart = day();
    await store.mongo.withSession(async (session) => {
      await session.withTransaction(async () => {
        const current = await records.findOne(
          { tenantId, periodStart, metric: "voiceSeconds" },
          { session },
        );
        seconds = Math.min(
          300,
          config.DAILY_VOICE_SECONDS - (current?.value || 0),
        );
        if (seconds <= 0)
          throw new AppError(
            429,
            "voice_limit",
            "Daily voice allowance reached.",
          );
        await add(
          tenantId,
          periodStart,
          "voiceSeconds",
          seconds,
          config.DAILY_VOICE_SECONDS,
          session,
        );
        await add(
          "__application",
          month(),
          "aiCents",
          Math.ceil(seconds / 60) * config.VOICE_RESERVE_CENTS_PER_MINUTE,
          config.MONTHLY_AI_LIMIT_CENTS,
          session,
        );
        await store.db
          .collection("voiceReservations")
          .insertOne(
            {
              tenantId,
              leaseId,
              periodStart,
              seconds,
              startedAt: new Date(),
              settled: false,
            },
            { session },
          );
      });
    });
    return seconds;
  }
  async function settleVoice(tenantId: string, leaseId: string) {
    await store.mongo.withSession(async (session) => {
      await session.withTransaction(async () => {
        const receipt = await store.db
          .collection("voiceReservations")
          .findOneAndUpdate(
            { tenantId, leaseId, settled: false },
            { $set: { settled: true } },
            { session, returnDocument: "before" },
          );
        if (!receipt) return;
        const used = Math.min(
          receipt.seconds,
          Math.max(
            1,
            Math.ceil((Date.now() - receipt.startedAt.getTime()) / 1000),
          ),
        );
        await records.updateOne(
          {
            tenantId,
            periodStart: receipt.periodStart,
            metric: "voiceSeconds",
          },
          { $inc: { value: used - receipt.seconds } },
          { session },
        );
      });
    });
  }
  async function status(tenantId: string) {
    const values = await records
      .find({ tenantId, periodStart: day() })
      .toArray();
    const value = (metric: string) =>
      values.find((v) => v.metric === metric)?.value || 0;
    return {
      chatUsed: value("chat"),
      chatLimit: config.DAILY_CHAT_LIMIT,
      voiceSecondsUsed: value("voiceSeconds"),
      voiceSecondsLimit: config.DAILY_VOICE_SECONDS,
      resetsAt: new Date(`${day()}T00:00:00Z`).getTime() + 86400000,
    };
  }
  return { reserveChat, reserveVoice, settleVoice, reserveSpeech, status };
}
export type Usage = ReturnType<typeof createUsage>;
