import test from "node:test";
import assert from "node:assert/strict";
import { VoiceSession } from "../session.mjs";

function harness(chat) {
  const events = [], calls = [], speakers = [];
  let clock = 1000, listener;
  const provider = {
    async listen(callback) { listener = callback; return { send() {}, close() {} }; },
    async speak(text, audio, end) { const speaker = { text, audio, end, closed: false, close() { this.closed = true; } }; speakers.push(speaker); return speaker; },
  };
  const session = new VoiceSession({ provider, now: () => clock, close() {}, send: event => events.push(event),
    api: async (path, body, signal) => {
      calls.push({ path, body, signal });
      if (path === "/voice/session") return { maxSeconds: 300 };
      if (path === "/voice/speech") return { text: "Safe owned reply." };
      return chat ? chat(signal) : { conversationId: body.conversationId, reply: { id: "reply", createdAt: "now", content: "Safe owned reply." } };
    },
  });
  return { session, events, calls, speakers, event: value => listener(value), advance: value => { clock += value; } };
}

test("voice sends partials and routes final transcript through existing mode-isolated API", async () => {
  const h = harness();
  await h.session.start("practice");
  h.event({ event: "transcript.partial", text: "Hel" });
  await h.session.respond("Hello");
  assert(h.events.some(e => e.type === "transcript" && e.text === "Hel"));
  assert.equal(h.calls.find(c => c.path === "/chat").body.mode, "practice");
  assert.equal(h.calls.find(c => c.path === "/chat").body.voice, true);
  assert.equal(h.speakers[0].text, "Safe owned reply.");
  h.session.stop();
});

test("barge-in closes synthesis immediately and discards stale audio", async () => {
  const h = harness(); await h.session.start("personal"); await h.session.respond("Hello");
  const old = h.speakers[0];
  old.audio(Buffer.from([1, 2]));
  assert.equal(h.events.filter(e => e.type === "audio").length, 1);
  h.session.interrupt(); assert(old.closed);
  old.audio(Buffer.from([3, 4]));
  assert.equal(h.events.filter(e => e.type === "audio").length, 1);
  h.session.stop();
});

test("late chat response after interruption cannot speak or render", async () => {
  let finish;
  const h = harness(() => new Promise(resolve => { finish = resolve; }));
  await h.session.start("personal");
  const pending = h.session.respond("Old turn");
  h.session.interrupt();
  assert(h.calls.find(c => c.path === "/chat").signal.aborted);
  finish({ reply: { id: "old" } }); await pending;
  assert.equal(h.events.filter(e => e.type === "reply").length, 0);
  assert.equal(h.speakers.length, 0); h.session.stop();
});

test("mute during thinking preserves text reply but suppresses speech", async () => {
  let finish;
  const h = harness(() => new Promise(resolve => { finish = resolve; }));
  await h.session.start("personal"); const pending = h.session.respond("Hello");
  h.session.setMuted(true);
  finish({ reply: { id: "new" } }); await pending;
  assert.equal(h.events.filter(e => e.type === "reply").length, 1);
  assert.equal(h.speakers.length, 0); h.session.stop();
});

test("server bounds audio frame size, pace, and session duration", async () => {
  const h = harness(); await h.session.start("personal");
  assert.throws(() => h.session.audio(Buffer.alloc(3202)));
  assert.throws(() => h.session.audio(Buffer.alloc(3)));
  for (let i = 0; i < 10; i++) h.session.audio(Buffer.alloc(3200));
  assert.throws(() => h.session.audio(Buffer.alloc(3200)));
  h.advance(301000); assert.throws(() => h.session.audio(Buffer.alloc(3200)));
  h.session.stop();
});

test("allowance hold ends the paid speech session instead of continuing capture", async () => {
  const h = harness(() => { const error = new Error("held"); error.status = 429; error.publicMessage = "Monthly processing allowance reached."; throw error; });
  await h.session.start("personal"); await h.session.respond("Hello");
  assert(h.session.closed);
  assert(h.events.some(event => event.type === "error" && event.message.includes("allowance")));
  assert.equal(h.speakers.length, 0);
});

test("synthesis handshake starts while thinking but text waits for owned-reply approval", async () => {
  let prepared = false, written;
  const h = harness(() => { assert(prepared); assert.equal(written, undefined); return { reply: { id: "reply", createdAt: "now" } }; });
  h.session.provider.prepareSpeech = async () => { prepared = true; return { write(text) { written = text; }, close() {} }; };
  await h.session.start("personal"); await h.session.respond("Hello");
  assert.equal(written, "Safe owned reply."); h.session.stop();
});

test("a handshake finishing after cancellation is closed without synthesis", async () => {
  const h = harness(); let finish, closed = false;
  h.session.provider.prepareSpeech = () => new Promise(resolve => { finish = resolve; });
  await h.session.start("personal"); const pending = h.session.respond("Hello");
  h.session.interrupt();
  finish({ close() { closed = true; }, write() { assert.fail("stale synthesis"); } });
  await pending; await Promise.resolve(); assert(closed); h.session.stop();
});
