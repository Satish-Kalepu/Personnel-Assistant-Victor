// Manual synthetic-only integration check. No microphone, provider key or token
// is printed. Run with the single known local fixture account and fixed WAV.
import { readFile } from "node:fs/promises";
import { WebSocket } from "ws";
import { WavPcm } from "../dist/voice/sarvam.mjs";
const login = await fetch("http://web:8080/api/auth/sign-in/email", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Victor-Client": "android" },
  body: JSON.stringify({
    email: "local-check-20261120@example.test",
    password: "Local verification passphrase 2026!",
  }),
});
if (!login.ok) throw new Error("Fixture sign-in failed");
const token = login.headers.get("set-auth-token");
const wav = await readFile("/fixtures/synthetic.wav");
const pcm = new WavPcm().push(wav);
const count = Math.floor(((pcm.length / 2) * 16000) / 24000),
  input = Buffer.alloc(count * 2);
for (let i = 0; i < count; i++) {
  const position = i * 1.5,
    a = Math.floor(position),
    b = Math.min(a + 1, pcm.length / 2 - 1);
  input.writeInt16LE(
    Math.round(
      pcm.readInt16LE(a * 2) * (1 - (position - a)) +
        pcm.readInt16LE(b * 2) * (position - a),
    ),
    i * 2,
  );
}
const ws = new WebSocket("ws://web:8080/voice");
const started = performance.now();
let readyAt,
  transcriptAt,
  audioAt,
  endedAt,
  replyAt,
  transcript = "",
  bytes = 0,
  timer,
  offset = 0,
  completed = false;
const deadline = setTimeout(() => {
  ws.terminate();
  console.error("Synthetic voice check timed out");
  process.exitCode = 1;
}, 45000);
ws.on("open", () =>
  ws.send(JSON.stringify({ type: "start", token, mode: process.env.VOICE_MODE || "practice" })),
);
ws.on("message", (data) => {
  const event = JSON.parse(data.toString());
  if (event.type === "ready") {
    readyAt = performance.now();
    timer = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) return;
      if (offset < input.length) {
        const chunk = input.subarray(offset, offset + 3200);
        ws.send(chunk);
        offset += chunk.length;
        if (offset >= input.length) endedAt = performance.now();
      } else if (offset < input.length + 32000) {
        ws.send(Buffer.alloc(3200));
        offset += 3200;
      } else clearInterval(timer);
    }, 100);
  }
  if (event.type === "transcript" && event.final) { transcript = event.text; transcriptAt=performance.now(); }
  if (event.type === "reply") replyAt = performance.now();
  if (event.type === "audio") {
    audioAt ??= performance.now();
    bytes += Buffer.from(event.audio, "base64").length;
  }
  if (event.type === "error") {
    console.error(
      JSON.stringify({ event: "voice_error", message: event.message }),
    );
    process.exitCode = 1;
    ws.close();
  }
  if (event.type === "speechEnd" && bytes > 0) {
    completed = true;
    console.log(
      JSON.stringify({
        syntheticOnly: true,
        readyMs: Math.round(readyAt - started),
        transcript,
        transcriptAfterInputMs: Math.round(transcriptAt-endedAt),
        replyAfterInputMs: Math.round(replyAt - endedAt),
        firstAudioAfterInputMs: Math.round(audioAt - endedAt),
        outputPcmBytes: bytes,
      }),
    );
    ws.send(JSON.stringify({ type: "stop" }));
    ws.close();
  }
});
ws.on("error", () => {
  console.error("Synthetic voice transport failed");
  process.exitCode = 1;
});
ws.on("close", () => {
  clearInterval(timer);
  clearTimeout(deadline);
  if (!completed) process.exitCode = 1;
});
