const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function environment(permission) {
  const tracks = { stopped: false, stop() { this.stopped = true; } };
  class AudioContext {
    constructor() { this.currentTime = 0; this.audioWorklet = { addModule: async () => {} }; this.destination = {}; }
    async resume() {}
    async close() { this.closed = true; }
    createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
    createBuffer(_, size) { return { duration: size / 24000, getChannelData: () => new Float32Array(size) }; }
    createBufferSource() { return { connect() {}, disconnect() {}, start() {}, stop() { this.stopped = true; } }; }
  }
  const sockets = [];
  class WebSocket {
    static OPEN = 1;
    constructor() { this.readyState = 1; this.bufferedAmount = 0; this.sent = []; sockets.push(this); }
    send(value) { this.sent.push(value); }
    close() { this.closed = true; this.onclose?.(); }
  }
  class AudioWorkletNode { constructor() { this.port = {}; } connect() {} disconnect() {} }
  const states = [], errors = [];
  const context = vm.createContext({
    window: { AudioWorkletNode }, AudioContext, AudioWorkletNode, WebSocket, URL,
    navigator: { mediaDevices: { getUserMedia: permission || (async () => ({ getTracks: () => [tracks] })) } },
    location: { href: "https://victor.test/v1/web/index.html" },
    setTimeout, clearTimeout, Uint8Array, DataView, Float32Array,
    atob: value => Buffer.from(value, "base64").toString("binary"),
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../web/voice.js"), "utf8"), context);
  const client = new context.window.VictorVoice({
    api: async () => ({ gatewayUrl: "wss://voice.test/voice" }), token: () => "synthetic-access-token",
    onState: value => states.push(value), onTranscript() {}, onReply() {}, onError: value => errors.push(value),
  });
  return { client, tracks, sockets, states, errors };
}

(async () => {
  let grant;
  const pending = environment(() => new Promise(resolve => { grant = resolve; }));
  const starting = pending.client.start("personal", null);
  await new Promise(resolve => setImmediate(resolve)); pending.client.stop();
  const lateTrack = { stopped: false, stop() { this.stopped = true; } };
  grant({ getTracks: () => [lateTrack] }); await starting;
  assert(lateTrack.stopped, "late permission must not leave the microphone running");
  assert.equal(pending.sockets.length, 0);

  const h = environment(); await h.client.start("practice", null);
  const ws = h.sockets[0]; ws.onopen();
  assert.equal(JSON.parse(ws.sent[0]).mode, "practice");
  ws.onmessage({ data: JSON.stringify({ type: "ready" }) });
  ws.onmessage({ data: JSON.stringify({ type: "clear", turn: 1 }) });
  const audio = { type: "audio", turn: 1, sampleRate: 24000, audio: Buffer.from([1, 0, 2, 0]).toString("base64") };
  ws.onmessage({ data: JSON.stringify(audio) }); assert.equal(h.client.sources.size, 1);
  h.client.interrupt(); assert.equal(h.client.sources.size, 0);
  ws.onmessage({ data: JSON.stringify({ type: "clear", turn: 2 }) });
  ws.onmessage({ data: JSON.stringify(audio) }); assert.equal(h.client.sources.size, 0, "old turn audio must be discarded");
  h.client.setMuted(true);
  ws.onmessage({ data: JSON.stringify({ ...audio, turn: 2 }) }); assert.equal(h.client.sources.size, 0);
  h.client.stop(); assert(h.tracks.stopped); assert(ws.closed); assert.equal(h.client.active, false);

  let Processor;
  const worklet = vm.createContext({ AudioWorkletProcessor: class { constructor() { this.port = { postMessage: data => frames.push(data) }; } }, sampleRate: 48000,
    registerProcessor: (_, value) => { Processor = value; }, Int16Array, ArrayBuffer, DataView, Math });
  const frames = [];
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../web/voice-worklet.js"), "utf8"), worklet);
  const processor = new Processor();
  for (let i = 0; i < 375; i++) processor.process([[new Float32Array(128).fill(0.5)]]);
  assert.equal(frames.length, 10, "one second at 48kHz must produce ten 100ms/16kHz frames");
  assert.equal(new DataView(frames[0]).getInt16(0, true), 16384);
  console.log("Web voice permission cleanup, cancellation, stale audio, mute, and PCM resampling passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
