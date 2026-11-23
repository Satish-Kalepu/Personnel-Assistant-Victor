import http from "node:http";
import { WebSocketServer } from "ws";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { sarvamProvider } from "./sarvam.mjs";
import { VoiceSession } from "./session.mjs";

const required = ["SARVAM_API_KEY", "COGNITO_USER_POOL_ID", "COGNITO_CLIENT_ID", "VICTOR_API_URL", "WEB_ORIGIN"];
for (const name of required) if (!process.env[name]) throw new Error(`Set ${name} on the server.`);
if (process.env.SARVAM_PRIVACY_CONFIRMED !== "true") throw new Error("Confirm Sarvam Model APIs zero-retention settings before enabling voice.");
const apiUrl = new URL(process.env.VICTOR_API_URL);
if (!/^https:\/\/[a-z0-9]+\.execute-api\.ap-south-1\.amazonaws\.com\/v1\/?$/.test(apiUrl.href)) throw new Error("Victor API must use the existing Mumbai HTTPS endpoint.");
if (!/^ap-south-1_[A-Za-z0-9]+$/.test(process.env.COGNITO_USER_POOL_ID)) throw new Error("Use the Mumbai Cognito user pool.");
const issuer = `https://cognito-idp.ap-south-1.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
const provider = sarvamProvider(process.env.SARVAM_API_KEY, process.env.SARVAM_SPEAKER || "simran_en_customer");
const owners = new Set();
const server = http.createServer((request, response) => {
  response.writeHead(request.url === "/health" ? 200 : 404, { "Content-Type": "text/plain", "Cache-Control": "no-store" });
  response.end(request.url === "/health" ? "ok" : "Not found");
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 16384, perMessageDeflate: false });
server.on("upgrade", (request, socket, head) => {
  if (request.url !== "/voice" || (request.headers.origin && request.headers.origin !== process.env.WEB_ORIGIN) || wss.clients.size >= 10) {
    socket.destroy(); return;
  }
  wss.handleUpgrade(request, socket, head, ws => wss.emit("connection", ws));
});
wss.on("connection", ws => {
  let session, authenticating = false, owner;
  const send = value => {
    if (ws.readyState === 1 && ws.bufferedAmount < 262144) ws.send(JSON.stringify(value));
    else ws.close(1013, "Connection too slow");
  };
  const authTimeout = setTimeout(() => ws.close(1008, "Sign in required"), 8000);
  let lifetime;
  ws.on("message", async (bytes, binary) => {
    try {
      if (!session) {
        if (binary || authenticating) throw new Error("Sign in first");
        authenticating = true;
        const data = JSON.parse(bytes.toString());
        if (data.type !== "start" || !["personal", "practice"].includes(data.mode)) throw new Error("Invalid start");
        const { payload } = await jwtVerify(data.token, jwks, { issuer, algorithms: ["RS256"] });
        if (payload.token_use !== "access" || payload.client_id !== process.env.COGNITO_CLIENT_ID || !payload.sub || !Number.isFinite(payload.exp) || owners.has(payload.sub)) throw new Error("Invalid session");
        if (data.conversationId && !/^[0-9a-f-]{36}$/i.test(data.conversationId)) throw new Error("Invalid conversation");
        if (ws.readyState !== 1) return;
        owner = payload.sub; owners.add(owner); clearTimeout(authTimeout);
        const token = data.token;
        const api = async (path, body, signal) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 35000);
          if (signal?.aborted) controller.abort();
          const cancel = () => controller.abort(); signal?.addEventListener("abort", cancel, { once: true });
          try {
            const response = await fetch(`${apiUrl.href.replace(/\/$/, "")}${path}`, {
              method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify(body), signal: controller.signal,
            });
            const result = await response.json();
            if (!response.ok) {
              const error = new Error("Victor request failed");
              error.status = response.status;
              error.publicMessage = [401, 422, 429, 503].includes(response.status) ? result.message : "Victor could not finish the voice request.";
              throw error;
            }
            return result;
          } finally { clearTimeout(timeout); signal?.removeEventListener("abort", cancel); }
        };
        session = new VoiceSession({ provider, api, send, close: () => ws.close() });
        lifetime = setTimeout(() => { send({ type: "error", message: "Voice session ended. Start voice again to continue." }); session.stop(); ws.close(); }, Math.max(0, Math.min(300000, payload.exp * 1000 - Date.now())));
        if (ws.readyState !== 1) { session.stop(); return; }
        await session.start(data.mode, data.conversationId);
      } else if (binary) session.audio(bytes);
      else {
        const data = JSON.parse(bytes.toString());
        if (data.type === "stop") { session.stop(); ws.close(); }
        else if (data.type === "interrupt") session.interrupt();
        else if (data.type === "mute" && typeof data.muted === "boolean") session.setMuted(data.muted);
        else throw new Error("Invalid voice control");
      }
    } catch { send({ type: "error", message: "Unable to start or continue voice. Sign in again, or use text chat." }); session?.stop(); ws.close(1008); }
  });
  ws.on("close", () => { clearTimeout(authTimeout); clearTimeout(lifetime); session?.stop(); if (owner) owners.delete(owner); });
  ws.on("error", () => { session?.stop(); ws.close(); });
});
server.listen(Number(process.env.PORT || 8080), "0.0.0.0", () => console.log("Victor voice gateway listening"));
// No request bodies, tokens, audio, transcripts, replies, or vendor error objects
// are logged. Shutdown closes microphone/provider sessions rather than replaying.
process.on("SIGTERM", () => { for (const ws of wss.clients) ws.close(1001); server.close(); });
