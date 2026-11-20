import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Store } from "./store.js";
import type { Usage } from "./usage.js";
import type { Model } from "./model.js";
import {
  AppError,
  checkedMessage,
  holdsSecret,
  idSchema,
  modeSchema,
} from "./errors.js";
type Mode = "personal" | "practice";
export type Tenant = Readonly<{ id: string }>;
const collection = (store: Store, name: string) =>
  store.db.collection<any>(name);
const publicRecord = (item: any) => {
  const { _id, tenantId, ...fields } = item;
  return {
    id: _id,
    ...Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [
        key,
        value instanceof Date ? value.toISOString() : value,
      ]),
    ),
  };
};
const factSchema = z.object({
  subject: z.string().trim().min(1).max(160),
  predicate: z.string().trim().min(1).max(160),
  object: z.string().trim().min(1).max(160),
  confidence: z.coerce.number().min(0.7).max(1),
});
export function validFact(value: unknown) {
  const result = factSchema.safeParse(value);
  return result.success &&
    ![result.data.subject, result.data.predicate, result.data.object].some(
      holdsSecret,
    )
    ? result.data
    : null;
}
export function createAssistant(store: Store, usage: Usage, model: Model) {
  const conversations = collection(store, "conversations"),
    messages = collection(store, "messages"),
    facts = collection(store, "facts");
  async function owned(tenant: Tenant, mode: Mode, id: string) {
    const conversation = await conversations.findOne({
      _id: idSchema.parse(id),
      tenantId: tenant.id,
      mode,
    });
    if (!conversation)
      throw new AppError(404, "not_found", "Conversation not found.");
    return conversation;
  }
  async function createConversation(tenant: Tenant, mode: Mode) {
    const id = randomUUID(),
      now = new Date();
    await conversations.insertOne({
      _id: id,
      tenantId: tenant.id,
      mode,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  }
  async function lock<T>(tenant: Tenant, id: string, work: () => Promise<T>) {
    const key = `conversation:${tenant.id}:${id}`,
      token = randomUUID();
    if (!(await store.redis.set(key, token, { NX: true, PX: 45000 })))
      throw new AppError(
        409,
        "conversation_busy",
        "Please wait for the current reply.",
      );
    try {
      return await work();
    } finally {
      await store.redis.eval(
        "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0",
        { keys: [key], arguments: [token] },
      );
    }
  }
  async function chat(tenant: Tenant, body: unknown, signal?: AbortSignal) {
    const input = z
      .object({
        mode: modeSchema,
        message: z.unknown(),
        conversationId: idSchema.optional(),
        clientMessageId: idSchema.optional(),
        voice: z.boolean().optional(),
      })
      .strict()
      .parse(body);
    const content = checkedMessage(input.message);
    const conversationId =
      input.conversationId || (await createConversation(tenant, input.mode));
    await owned(tenant, input.mode, conversationId);
    return lock(tenant, conversationId, async () => {
      if (input.clientMessageId) {
        const existing = await messages.findOne({
          tenantId: tenant.id,
          mode: input.mode,
          conversationId,
          clientMessageId: input.clientMessageId,
          role: "user",
        });
        if (existing) {
          const reply = await messages.findOne({
            tenantId: tenant.id,
            mode: input.mode,
            conversationId,
            role: "assistant",
            turnId: existing.turnId,
          });
          if (existing.content !== content || !reply)
            throw new AppError(
              409,
              "retry_conflict",
              "Retry identifier does not match this message.",
            );
          return {
            conversationId,
            reply: publicRecord(reply),
            factsAdded: existing.factsAdded || 0,
          };
        }
      }
      const prior = (
        await messages
          .find({ tenantId: tenant.id, mode: input.mode, conversationId })
          .sort({ createdAt: -1, _id: -1 })
          .limit(8)
          .toArray()
      ).reverse();
      const memory =
        input.mode === "personal"
          ? await facts
              .find({ tenantId: tenant.id, mode: "personal" })
              .sort({ createdAt: -1, _id: -1 })
              .limit(30)
              .project({ subject: 1, predicate: 1, object: 1, _id: 0 })
              .toArray()
          : [];
      await usage.reserveChat(tenant.id);
      const answer = await model.reply(
        {
          mode: input.mode,
          prior: prior.map((v) => ({ role: v.role, content: v.content })),
          content,
          facts: memory,
          voice: !!input.voice,
        },
        signal,
      );
      const turnId = randomUUID(),
        sourceId = randomUUID(),
        now = new Date();
      const proposed =
        input.mode === "personal"
          ? answer.facts
              .slice(0, 5)
              .map(validFact)
              .filter((v) => v !== null)
          : [];
      const reply = {
        _id: randomUUID(),
        tenantId: tenant.id,
        mode: input.mode,
        conversationId,
        turnId,
        role: "assistant",
        content: answer.reply,
        createdAt: new Date(now.getTime() + 1),
      };
      await store.mongo.withSession(async (session) => {
        await session.withTransaction(async () => {
          const parent = await conversations.updateOne(
            { _id: conversationId, tenantId: tenant.id, mode: input.mode },
            { $set: { updatedAt: reply.createdAt } },
            { session },
          );
          if (!parent.matchedCount)
            throw new AppError(404, "not_found", "Conversation not found.");
          await messages.insertMany(
            [
              {
                _id: sourceId,
                tenantId: tenant.id,
                mode: input.mode,
                conversationId,
                turnId,
                role: "user",
                content,
                createdAt: now,
                factsAdded: proposed.length,
                ...(input.clientMessageId
                  ? { clientMessageId: input.clientMessageId }
                  : {}),
              },
              reply,
            ],
            { session },
          );
          if (proposed.length)
            await facts.insertMany(
              proposed.map((fact) => ({
                _id: randomUUID(),
                tenantId: tenant.id,
                mode: "personal",
                ...fact,
                sourceMessageId: sourceId,
                sourceConversationId: conversationId,
                createdAt: now,
                updatedAt: now,
                reviewed: false,
              })),
              { session },
            );
        });
      });
      return {
        conversationId,
        reply: publicRecord(reply),
        factsAdded: proposed.length,
      };
    });
  }
  async function history(tenant: Tenant, query: unknown) {
    const { mode, conversationId, cursor } = z
      .object({
        mode: modeSchema,
        conversationId: idSchema.optional(),
        cursor: idSchema.optional(),
      })
      .strict()
      .parse(query);
    if (conversationId) await owned(tenant, mode, conversationId);
    const filter: any = {
      tenantId: tenant.id,
      mode,
      ...(conversationId ? { conversationId } : {}),
    };
    if (cursor) {
      const anchor = await messages.findOne({ ...filter, _id: cursor });
      if (!anchor) throw new AppError(400, "cursor", "Invalid message cursor.");
      filter.$or = [
        { createdAt: { $lt: anchor.createdAt } },
        { createdAt: anchor.createdAt, _id: { $lt: cursor } },
      ];
    }
    const rows = await messages
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(101)
      .toArray();
    const page = rows.slice(0, 100);
    const nextCursor = rows.length > 100 ? page.at(-1)._id : null;
    return { messages: page.reverse().map(publicRecord), nextCursor };
  }
  async function listFacts(tenant: Tenant, query: unknown) {
    const { reviewed, cursor } = z
      .object({
        reviewed: z.enum(["true", "false"]).optional(),
        cursor: idSchema.optional(),
      })
      .strict()
      .parse(query);
    const filter: any = {
      tenantId: tenant.id,
      mode: "personal",
      ...(reviewed ? { reviewed: reviewed === "true" } : {}),
    };
    if (cursor) {
      const anchor = await facts.findOne({
        _id: cursor,
        tenantId: tenant.id,
        mode: "personal",
      });
      if (!anchor) throw new AppError(400, "cursor", "Invalid memory cursor.");
      filter.$or = [
        { createdAt: { $lt: anchor.createdAt } },
        { createdAt: anchor.createdAt, _id: { $lt: cursor } },
      ];
    }
    const rows = await facts
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(101)
      .toArray();
    const page = rows.slice(0, 100);
    return {
      facts: page.map(publicRecord),
      nextCursor: rows.length > 100 ? page.at(-1)._id : null,
    };
  }
  async function updateFact(tenant: Tenant, id: string, body: unknown) {
    const input = z
      .object({
        subject: z.string().optional(),
        predicate: z.string().optional(),
        object: z.string().optional(),
        reviewed: z.literal(true).optional(),
      })
      .strict()
      .refine((v) => Object.keys(v).length > 0)
      .parse(body);
    const current = await facts.findOne({
      _id: idSchema.parse(id),
      tenantId: tenant.id,
      mode: "personal",
    });
    if (!current) throw new AppError(404, "not_found", "Fact not found.");
    const checked = validFact({ ...current, ...input });
    if (!checked)
      throw new AppError(
        400,
        "invalid_fact",
        "Fact is invalid or may contain confidential details.",
      );
    const changed = ["subject", "predicate", "object"].some(
      (key) =>
        key in input && input[key as keyof typeof input] !== current[key],
    );
    const result = await facts.findOneAndUpdate(
      { _id: id, tenantId: tenant.id, mode: "personal" },
      {
        $set: {
          ...checked,
          reviewed: true,
          reviewedAt: new Date(),
          updatedAt: new Date(),
          ...(changed ? { corrected: true } : {}),
        },
      },
      { returnDocument: "after" },
    );
    return { fact: publicRecord(result) };
  }
  async function deleteFact(tenant: Tenant, id: string) {
    const result = await facts.deleteOne({
      _id: idSchema.parse(id),
      tenantId: tenant.id,
      mode: "personal",
    });
    if (!result.deletedCount)
      throw new AppError(404, "not_found", "Fact not found.");
    return { deleted: true };
  }
  async function deleteConversation(tenant: Tenant, mode: Mode, id: string) {
    await owned(tenant, mode, id);
    return lock(tenant, id, async () => {
      await store.mongo.withSession(async (session) => {
        await session.withTransaction(async () => {
          await conversations.deleteOne(
            { _id: id, tenantId: tenant.id, mode },
            { session },
          );
          await messages.deleteMany(
            { tenantId: tenant.id, mode, conversationId: id },
            { session },
          );
          await facts.deleteMany(
            { tenantId: tenant.id, mode: "personal", sourceConversationId: id },
            { session },
          );
        });
      });
      return { deleted: true };
    });
  }
  async function speech(tenant: Tenant, body: unknown) {
    const { mode, messageId } = z
      .object({
        mode: modeSchema,
        messageId: idSchema,
        createdAt: z.string().optional(),
      })
      .strict()
      .parse(body);
    const message = await messages.findOne({
      _id: messageId,
      tenantId: tenant.id,
      mode,
      role: "assistant",
    });
    if (!message) throw new AppError(404, "not_found", "Reply not found.");
    if (holdsSecret(message.content))
      throw new AppError(
        422,
        "secret_hold",
        "This reply cannot be spoken. Read the text instead.",
      );
    await usage.reserveSpeech(tenant.id, message.content.length);
    return { text: message.content };
  }
  return {
    chat,
    history,
    listFacts,
    updateFact,
    deleteFact,
    deleteConversation,
    speech,
    owned,
    createConversation,
  };
}
export type Assistant = ReturnType<typeof createAssistant>;
