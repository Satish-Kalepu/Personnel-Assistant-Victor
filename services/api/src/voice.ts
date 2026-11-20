import type { Server, IncomingMessage } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import type { Config } from "./config.js";
import type { Store } from "./store.js";
import type { Identity } from "./auth.js";
import type { Assistant, Tenant } from "./assistant.js";
import type { Usage } from "./usage.js";
import { AppError, modeSchema, idSchema } from "./errors.js";
import { rateLimit } from "./security.js";
import { VoiceSession } from "./voice/session.mjs";
import { sarvamProvider } from "./voice/sarvam.mjs";
const acquire = `redis.call('ZREMRANGEBYSCORE',KEYS[2],'-inf',ARGV[2]); if redis.call('EXISTS',KEYS[1])==1 or redis.call('ZCARD',KEYS[2])>=20 then return 0 end; redis.call('SET',KEYS[1],ARGV[1],'PX',9000); redis.call('ZADD',KEYS[2],ARGV[3],ARGV[1]); return 1`;
const renew = `if redis.call('GET',KEYS[1])~=ARGV[1] then return 0 end; redis.call('PEXPIRE',KEYS[1],9000); redis.call('ZADD',KEYS[2],ARGV[2],ARGV[1]); return 1`;
const release = `if redis.call('GET',KEYS[1])==ARGV[1] then redis.call('DEL',KEYS[1]) end; redis.call('ZREM',KEYS[2],ARGV[1]); return 1`;
export function attachVoice(
  server: Server,
  store: Store,
  config: Config,
  identity: Identity,
  assistant: Assistant,
  usage: Usage,
  providerOverride?: ReturnType<typeof sarvamProvider>,
) {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 16384,
    perMessageDeflate: false,
  });
  const provider =
    providerOverride ??
    (config.SARVAM_API_KEY
      ? sarvamProvider(config.SARVAM_API_KEY, config.SARVAM_SPEAKER)
      : null);
  server.on("upgrade", (request, socket, head) => {
    const origin = request.headers.origin;
    if (
      request.url !== "/voice" ||
      (origin && origin !== config.APP_ORIGIN) ||
      wss.clients.size >= 30
    ) {
      socket.destroy();
      return;
    }
    const ip = String(
      request.headers["x-forwarded-for"] ||
        request.socket.remoteAddress ||
        "unknown",
    );
    rateLimit(store, config.AUTH_SECRET, "voice-connect", ip, 30, 600)
      .then(() => {
        if (!socket.destroyed)
          wss.handleUpgrade(request, socket, head, (ws) =>
            wss.emit("connection", ws, request),
          );
      })
      .catch(() => socket.destroy());
  });
  wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
    let session: VoiceSession | undefined,
      starting = false,
      closed = false,
      tenant: Tenant | undefined,
      conversationId: string | undefined,
      leaseId: string | undefined;
    let headers: Headers,
      mode: "personal" | "practice",
      lifetime: NodeJS.Timeout | undefined,
      heartbeat: NodeJS.Timeout | undefined,
      checking = false;
    const send = (value: unknown) => {
      if (ws.readyState === WebSocket.OPEN && ws.bufferedAmount < 262144)
        ws.send(JSON.stringify(value));
      else ws.close(1013, "Slow connection");
    };
    const authTimeout = setTimeout(
      () => ws.close(1008, "Sign in required"),
      8000,
    );
    async function stop() {
      closed = true;
      clearTimeout(authTimeout);
      clearTimeout(lifetime);
      clearInterval(heartbeat);
      session?.stop();
      if (tenant && leaseId) {
        const current = leaseId;
        leaseId = undefined;
        await Promise.allSettled([
          store.redis.eval(release, {
            keys: [`voice:${tenant.id}`, "voice:active"],
            arguments: [current],
          }),
          usage.settleVoice(tenant.id, current),
        ]);
      }
    }
    async function check() {
      if (checking || closed || !tenant || !leaseId) return;
      checking = true;
      try {
        const active = await identity.auth.api.getSession({ headers });
        if (!active || active.user.id !== tenant.id) throw new Error("revoked");
        await assistant.owned(tenant, mode, conversationId!);
        const alive = await store.redis.eval(renew, {
          keys: [`voice:${tenant.id}`, "voice:active"],
          arguments: [leaseId, String(Date.now() + 9000)],
        });
        if (!alive) throw new Error("lease expired");
        ws.ping();
      } catch {
        send({
          type: "error",
          message: "Session ended. Sign in or start voice again.",
        });
        await stop();
        ws.close(1008, "Session ended");
      } finally {
        checking = false;
      }
    }
    ws.on("message", async (bytes, binary) => {
      try {
        if (!session) {
          if (starting || binary || closed)
            throw new AppError(401, "unauthorized", "Sign in required.");
          starting = true;
          const start = z
            .object({
              type: z.literal("start"),
              mode: modeSchema,
              conversationId: idSchema.nullish(),
              token: z.string().max(1024).nullish(),
            })
            .strict()
            .parse(JSON.parse(bytes.toString()));
          headers = new Headers();
          if (request.headers.origin && request.headers.cookie)
            headers.set("cookie", request.headers.cookie);
          else if (start.token)
            headers.set("authorization", `Bearer ${start.token}`);
          const active = await identity.auth.api.getSession({ headers });
          if (!active?.user.emailVerified)
            throw new AppError(401, "unauthorized", "Sign in required.");
          if (
            !provider ||
            !config.OPENAI_API_KEY ||
            config.SARVAM_PRIVACY_CONFIRMED !== "true"
          )
            throw new AppError(
              503,
              "provider_config",
              "Voice needs configured AI providers.",
            );
          if (closed) return;
          tenant = Object.freeze({ id: active.user.id });
          mode = start.mode;
          conversationId =
            start.conversationId ||
            (await assistant.createConversation(tenant, mode));
          await assistant.owned(tenant, mode, conversationId);
          const candidate = randomUUID(),
            now = Date.now();
          const acquired = await store.redis.eval(acquire, {
            keys: [`voice:${tenant.id}`, "voice:active"],
            arguments: [candidate, String(now), String(now + 9000)],
          });
          if (!acquired)
            throw new AppError(
              409,
              "voice_busy",
              "A voice session is already active, or the service is busy.",
            );
          leaseId = candidate;
          if (closed) {
            await stop();
            return;
          }
          const maxSeconds = await usage.reserveVoice(tenant.id, leaseId);
          if (closed) {
            await usage.settleVoice(tenant.id, candidate);
            return;
          }
          const context = tenant;
          const api = async (path: string, body: any, signal?: AbortSignal) => {
            const current = await identity.auth.api.getSession({ headers });
            if (!current || current.user.id !== context.id)
              throw new AppError(401, "unauthorized", "Sign in again.");
            if (path === "/voice/session") return { maxSeconds };
            if (path === "/chat") return assistant.chat(context, body, signal);
            if (path === "/voice/speech")
              return assistant.speech(context, body);
            throw new Error("Unknown voice operation");
          };
          session = new VoiceSession({
            provider,
            api,
            send,
            close: () => ws.close(),
          });
          clearTimeout(authTimeout);
          heartbeat = setInterval(() => {
            void check();
          }, 3000);
          lifetime = setTimeout(() => {
            send({
              type: "error",
              message: "Voice allowance for this session ended.",
            });
            void stop();
            ws.close();
          }, maxSeconds * 1000);
          await session.start(mode, conversationId);
          if (closed) session.stop();
          return;
        }
        if (closed) return;
        if (binary)
          session.audio(
            Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes as ArrayBuffer),
          );
        else {
          const data = JSON.parse(bytes.toString());
          if (data.type === "interrupt") session.interrupt();
          else if (data.type === "mute" && typeof data.value === "boolean")
            session.setMuted(data.value);
          else if (data.type === "stop") {
            await stop();
            ws.close();
          } else throw new Error("Invalid voice control");
        }
      } catch (error) {
        send({
          type: "error",
          message:
            error instanceof AppError
              ? error.message
              : "Voice connection could not continue. Please try again.",
        });
        await stop();
        ws.close(1008, "Voice ended");
      }
    });
    ws.on("close", () => {
      void stop();
    });
    ws.on("error", () => {
      void stop();
    });
  });
  return {
    close() {
      for (const client of wss.clients) client.close(1001, "Server restarting");
      wss.close();
    },
  };
}
