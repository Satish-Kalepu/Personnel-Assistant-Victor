import test from "node:test";
import assert from "node:assert/strict";
import { WebSocketServer } from "ws";
import { SarvamAIClient } from "sarvamai";
import { WavPcm } from "../sarvam.mjs";

test("pinned SDK uses server-side auth headers for the realtime STT handshake", async () => {
  const server = new WebSocketServer({ port: 0, host: "127.0.0.1" });
  await new Promise(resolve => server.once("listening", resolve));
  const received = new Promise(resolve => server.once("connection", (socket, request) => resolve({ socket, request })));
  const client = new SarvamAIClient({ baseUrl: `ws://127.0.0.1:${server.address().port}`, apiSubscriptionKey: "synthetic-test-key" });
  const socket = await client.speechToTextRealtimeStreaming.connect({ "Api-Subscription-Key": "synthetic-test-key", model: "saaras:v4", language_code: "en-IN", reconnectAttempts: 0 });
  try {
    await socket.waitForOpen();
    const peer = await received;
    assert.equal(peer.request.headers["api-subscription-key"], "synthetic-test-key");
    assert.match(peer.request.url, /^\/speech-to-text-realtime\/ws\?/);
    const message = new Promise(resolve => peer.socket.once("message", bytes => resolve(JSON.parse(bytes.toString()))));
    socket.sendRealtimeAudioInput({ event: "audio_input", audio: "AAA=" });
    assert.deepEqual(await message, { event: "audio_input", audio: "AAA=" });
  } finally { socket.close(); for (const peer of server.clients) peer.terminate(); await new Promise(resolve => server.close(resolve)); }
});

function wav(samples, channels = 1) {
  const bytes = Buffer.alloc(44 + samples.length);
  bytes.write("RIFF", 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(channels, 22);
  bytes.writeUInt32LE(24000, 24); bytes.writeUInt32LE(48000, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36); bytes.writeUInt32LE(samples.length, 40); samples.copy(bytes, 44); return bytes;
}

test("pinned TTS SDK authenticates, configures WAV, and flushes without a client-side key", async () => {
  const server = new WebSocketServer({ port: 0, host: "127.0.0.1" });
  await new Promise(resolve => server.once("listening", resolve));
  const received = new Promise(resolve => server.once("connection", (socket, request) => resolve({ socket, request })));
  const client = new SarvamAIClient({ baseUrl: `ws://127.0.0.1:${server.address().port}`, apiSubscriptionKey: "synthetic-test-key" });
  const socket = await client.textToSpeechStreaming.connect({ model: "bulbul:v4-flash", send_completion_event: true, reconnectAttempts: 0 });
  try {
    await socket.waitForOpen(); const peer = await received;
    assert.equal(peer.request.headers["api-subscription-key"], "synthetic-test-key");
    const messages = [];
    const done = new Promise(resolve => peer.socket.on("message", bytes => { messages.push(JSON.parse(bytes.toString())); if (messages.length === 3) resolve(); }));
    socket.configureConnection({ language_code: "en-IN", speaker: "simran_en_customer", speech_sample_rate: 24000, output_audio_codec: "wav" });
    socket.convert("Synthetic ordinary test."); socket.flush(); await done;
    assert.equal(messages[0].data.output_audio_codec, "wav");
    assert.equal(messages[1].type, "text"); assert.equal(messages[2].type, "flush");
  } finally { socket.close(); for (const peer of server.clients) peer.terminate(); await new Promise(resolve => server.close(resolve)); }
});

test("WAV parser handles split headers, per-segment headers, and PCM continuation", () => {
  const parser = new WavPcm(), source = wav(Buffer.from([1, 2, 3, 4]));
  assert.equal(parser.push(source.subarray(0, 20)).length, 0);
  assert.deepEqual(parser.push(source.subarray(20)), Buffer.from([1, 2, 3, 4]));
  assert.deepEqual(parser.push(Buffer.from([5, 6])), Buffer.from([5, 6]));
  assert.deepEqual(parser.push(wav(Buffer.from([7, 8]))), Buffer.from([7, 8]));
  assert.throws(() => new WavPcm().push(wav(Buffer.from([1, 2]), 2)));
});
