import { MongoClient, type Db } from "mongodb";
import { createClient } from "redis";
import type { Config } from "./config.js";
export async function connectStore(config: Config) {
  const mongo = new MongoClient(config.MONGODB_URI, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 20000,
  });
  const redis = createClient({
    url: config.REDIS_URL,
    socket: { connectTimeout: 5000 },
  });
  redis.on("error", () =>
    console.error(JSON.stringify({ event: "redis_unavailable" })),
  );
  await Promise.all([mongo.connect(), redis.connect()]);
  const db = mongo.db("victor");
  return {
    mongo,
    redis,
    db,
    async close() {
      await Promise.allSettled([mongo.close(), redis.quit()]);
    },
  };
}
export type Store = Awaited<ReturnType<typeof connectStore>>;
export async function ensureIndexes(db: Db) {
  const indexes: Record<
    string,
    Parameters<ReturnType<Db["collection"]>["createIndexes"]>[0]
  > = {
    user: [{ key: { email: 1 }, unique: true }],
    session: [
      { key: { token: 1 }, unique: true },
      { key: { userId: 1 } },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    ],
    account: [
      { key: { userId: 1 } },
      { key: { providerId: 1, accountId: 1 }, unique: true },
    ],
    verification: [
      { key: { identifier: 1 } },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    ],
    conversations: [{ key: { tenantId: 1, mode: 1, updatedAt: -1, _id: -1 } }],
    messages: [
      {
        key: { tenantId: 1, mode: 1, conversationId: 1, createdAt: 1, _id: 1 },
      },
      { key: { tenantId: 1, mode: 1, createdAt: -1, _id: -1 } },
      {
        key: { tenantId: 1, conversationId: 1, clientMessageId: 1 },
        unique: true,
        partialFilterExpression: {
          clientMessageId: { $type: "string" },
          role: "user",
        },
      },
    ],
    facts: [
      { key: { tenantId: 1, mode: 1, reviewed: 1, createdAt: -1, _id: -1 } },
      { key: { tenantId: 1, mode: 1, createdAt: -1, _id: -1 } },
      { key: { tenantId: 1, sourceConversationId: 1 } },
    ],
    challenges: [
      { key: { email: 1, purpose: 1 }, unique: true },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    ],
    recoveryCodes: [{ key: { tenantId: 1, digest: 1 }, unique: true }],
    usage: [{ key: { tenantId: 1, periodStart: 1, metric: 1 }, unique: true }],
    voiceReservations: [{ key: { tenantId: 1, leaseId: 1 }, unique: true }],
    outbox: [
      { key: { state: 1, nextAttemptAt: 1 } },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    ],
  };
  for (const [collection, spec] of Object.entries(indexes))
    await db.collection(collection).createIndexes(spec);
}
