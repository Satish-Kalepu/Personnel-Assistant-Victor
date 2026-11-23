import { test, after } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocket } from "ws";
import { loadConfig } from "../dist/config.js";
import { connectStore, ensureIndexes } from "../dist/store.js";
import { createApplication } from "../dist/app.js";
import { createUsage } from "../dist/usage.js";
import { createMailer } from "../dist/mail.js";
import { attachVoice } from "../dist/voice.js";
assert.equal(
  process.env.VICTOR_TESTING,
  "true",
  "Run only with the isolated victor-test Compose project.",
);
const config = loadConfig();
assert.equal(config.APP_ORIGIN, "http://localhost:18080");
assert.equal(config.OPENAI_API_KEY, "");
const store = await connectStore(config);
await ensureIndexes(store.db);
const seen = [];
const runtime = createApplication(store, config, {
  async reply(input) {
    seen.push(input);
    return {
      reply: `Hello from ${input.mode}.`,
      facts: [
        {
          subject: "I",
          predicate: "enjoy",
          object: input.content,
          confidence: 0.9,
        },
      ],
    };
  },
});
const listeners = [];
const speechStub = {
  async listenManual(callback) {
    listeners.push(callback);
    return { send() {}, finish() { callback({event:'vad.speech_end',pendingTranscripts:0,speechActive:false}); }, close() {} };
  },
  async listen(callback) {
    listeners.push(callback);
    return { send() {}, close() {} };
  },
  async prepareSpeech(audio, end) {
    return {
      closed: false,
      write() {
        queueMicrotask(() => {
          audio(Buffer.alloc(480));
          end();
        });
      },
      close() {
        this.closed = true;
      },
    };
  },
  async speak(text, audio, end, error) {
    const stream = await this.prepareSpeech(audio, end, error);
    stream.write(text);
    return stream;
  },
};
const server = createServer(runtime.app);
const voice = attachVoice(
  server,
  store,
  {
    ...config,
    OPENAI_API_KEY: "synthetic-test-only",
    SARVAM_API_KEY: "synthetic-test-only",
    SARVAM_PRIVACY_CONFIRMED: "true",
  },
  runtime.identity,
  runtime.assistant,
  runtime.usage,
  speechStub,
);
server.listen(0, "0.0.0.0");
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}`;
const run = randomUUID(),
  password = "A unique test passphrase 123!",
  newPassword = "Another unique passphrase 456!";
const alice = `alice-${run}@example.test`,
  bob = `bob-${run}@example.test`;
let aliceToken,
  bobToken,
  aliceCookie,
  aliceId,
  conversationId,
  fact,
  backupCodes;
async function call(
  path,
  {
    method = "GET",
    body,
    token,
    cookie,
    origin = config.APP_ORIGIN,
    native = false,
    clientIp,
  } = {},
) {
  const headers = { "Content-Type": "application/json" };
  if (clientIp) headers['X-Forwarded-For'] = clientIp;
  if (origin) headers.Origin = origin;
  if (native) headers["X-Victor-Client"] = "android";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(base + path, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const value = await response.json();
  return {
    status: response.status,
    body: value,
    token: response.headers.get("set-auth-token"),
    cookie: response.headers
      .getSetCookie()
      .map((v) => v.split(";")[0])
      .join("; "),
  };
}
async function mailCode(email, subject = "Verify your Victor email") {
  for (let i = 0; i < 100; i++) {
    await runtime.mail.drain();
    const search = await fetch(
      `http://mailpit:8025/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
    ).then((r) => r.json());
    for (const item of search.messages || []) {
      if (item.Subject !== subject) continue;
      const message = await fetch(
        `http://mailpit:8025/api/v1/message/${item.ID}`,
      ).then((r) => r.json());
      const code = message.Text?.match(/\b\d{6}\b/);
      if (code) return code[0];
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Local verification email did not arrive.");
}
after(async () => {
  voice.close();
  runtime.mail.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await store.close();
});
test("public signup verifies email before creating any credential; code is single use", async () => {
  assert.equal(
    (
      await call("/api/account/register", {
        method: "POST",
        body: { email: alice },
      })
    ).status,
    200,
  );
  assert.equal(
    await store.db.collection("user").countDocuments({ email: alice }),
    0,
  );
  const code = await mailCode(alice);
  const verified = await call("/api/account/verify-registration", {
    method: "POST",
    body: { email: alice, code, password, name: "Alice" },
  });
  assert.equal(verified.status, 200, JSON.stringify(verified.body));
  backupCodes = verified.body.recoveryCodes;
  assert.equal(backupCodes.length, 10);
  assert.equal(
    (
      await call("/api/account/verify-registration", {
        method: "POST",
        body: { email: alice, code, password, name: "Alice" },
      })
    ).status,
    400,
  );
  const record = await store.db.collection("user").findOne({ email: alice });
  assert.equal(record.emailVerified, true);
  const credential = await store.db
    .collection("account")
    .findOne({ providerId: "credential" });
  assert.ok(credential.password);
  assert.notEqual(credential.password, password);
  const challenge = await store.db
    .collection("challenges")
    .findOne({ email: alice });
  assert.notEqual(challenge.digest, code);
  assert.equal(challenge.payload, undefined);
});
test("browser cookie and signed native bearer sessions authenticate; unsigned tokens fail", async () => {
  const login = await call("/api/auth/sign-in/email", {
    method: "POST",
    body: { email: alice, password },
    native: true,
    origin: null,
  });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  assert.ok(login.token?.includes("."));
  aliceToken = login.token;
  aliceCookie = login.cookie;
  const native = await call("/api/me", {
    token: aliceToken,
    native: true,
    origin: null,
  });
  assert.equal(native.status, 200);
  aliceId = native.body.user.id;
  assert.equal((await call("/api/me", { cookie: aliceCookie })).status, 200);
  assert.equal(
    (await call("/api/me", { token: aliceToken.split(".")[0] })).status,
    401,
  );
  assert.equal((await call("/api/me")).status, 401);
});
test("auth endpoint allowlist, browser origin checks and strict tenant inputs block bypasses", async () => {
  assert.equal(
    (
      await call("/api/auth/sign-up/email", {
        method: "POST",
        body: { email: bob, password, name: "Bob" },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await call("/api/auth/reset-password", {
        method: "POST",
        body: { token: "bad", newPassword: password },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await call("/api/auth/sign-in/email", {
        method: "POST",
        origin: "https://attacker.invalid",
        body: { email: alice, password },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("/api/chat", {
        method: "POST",
        token: aliceToken,
        body: { mode: "personal", message: "hello", tenantId: "other" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("/api/chat", {
        method: "POST",
        token: aliceToken,
        body: { mode: { $ne: "practice" }, message: "hello" },
      })
    ).status,
    400,
  );
});
test("chat stores source-linked facts; retries do not repeat the model call or reservation", async () => {
  const conversation = await call("/api/conversations", {
    method: "POST",
    token: aliceToken,
    body: { mode: "personal" },
  });
  conversationId = conversation.body.conversationId;
  const input = {
    mode: "personal",
    conversationId,
    message: "gardening",
    clientMessageId: randomUUID(),
  };
  const first = await call("/api/chat", {
    method: "POST",
    token: aliceToken,
    body: input,
  });
  assert.equal(first.status, 200, JSON.stringify(first.body));
  const calls = seen.length;
  const retry = await call("/api/chat", {
    method: "POST",
    token: aliceToken,
    body: input,
  });
  assert.equal(retry.status, 200);
  assert.equal(retry.body.reply.id, first.body.reply.id);
  assert.equal(seen.length, calls);
  const facts = await call("/api/facts", { token: aliceToken });
  fact = facts.body.facts[0];
  assert.equal(fact.sourceConversationId, conversationId);
  assert.equal(fact.reviewed, false);
  const history = await call(
    `/api/messages?mode=personal&conversationId=${conversationId}`,
    { token: aliceToken },
  );
  assert.deepEqual(
    history.body.messages.map((m) => m.role),
    ["user", "assistant"],
  );
});
test("second tenant cannot read, edit, delete, speak, paginate into or reuse first tenant data", async () => {
  await call("/api/account/register", { method: "POST", body: { email: bob } });
  const code = await mailCode(bob);
  assert.equal(
    (
      await call("/api/account/verify-registration", {
        method: "POST",
        body: { email: bob, code, password, name: "Bob" },
      })
    ).status,
    200,
  );
  const login = await call("/api/auth/sign-in/email", {
    method: "POST",
    body: { email: bob, password },
    native: true,
    origin: null,
  });
  bobToken = login.token;
  assert.ok(bobToken);
  assert.equal(
    (
      await call(
        `/api/messages?mode=personal&conversationId=${conversationId}`,
        { token: bobToken },
      )
    ).status,
    404,
  );
  assert.equal(
    (await call("/api/messages?mode=personal", { token: bobToken })).body
      .messages.length,
    0,
  );
  assert.equal(
    (await call("/api/facts", { token: bobToken })).body.facts.length,
    0,
  );
  assert.equal(
    (await call(`/api/facts?cursor=${fact.id}`, { token: bobToken })).status,
    400,
  );
  assert.equal(
    (
      await call(`/api/facts/${fact.id}`, {
        method: "PATCH",
        token: bobToken,
        body: { object: "stolen" },
      })
    ).status,
    404,
  );
  assert.equal(
    (await call(`/api/facts/${fact.id}`, { method: "DELETE", token: bobToken }))
      .status,
    404,
  );
  assert.equal(
    (
      await call(`/api/conversations/${conversationId}?mode=personal`, {
        method: "DELETE",
        token: bobToken,
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await call("/api/chat", {
        method: "POST",
        token: bobToken,
        body: { mode: "personal", conversationId, message: "hello" },
      })
    ).status,
    404,
  );
  const b = await runtime.identity.auth.api.getSession({
    headers: new Headers({ authorization: `Bearer ${bobToken}` }),
  });
  const ownMessages = await store.db
    .collection("messages")
    .findOne({ tenantId: aliceId, role: "assistant" });
  await assert.rejects(
    runtime.assistant.speech(
      { id: b.user.id },
      { mode: "personal", messageId: ownMessages._id },
    ),
    (e) => e.status === 404,
  );
});
test("practice has no personal memory or extracted facts; secret holds happen before model/storage", async () => {
  const prior = await store.db
    .collection("facts")
    .countDocuments({ tenantId: aliceId });
  const response = await call("/api/chat", {
    method: "POST",
    token: aliceToken,
    body: { mode: "practice", message: "Help me greet a friend" },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(seen.at(-1).facts, []);
  assert.equal(
    await store.db.collection("facts").countDocuments({ tenantId: aliceId }),
    prior,
  );
  const calls = seen.length;
  assert.equal(
    (
      await call("/api/chat", {
        method: "POST",
        token: aliceToken,
        body: { mode: "personal", message: "My password is confidential" },
      })
    ).status,
    422,
  );
  assert.equal(seen.length, calls);
  assert.equal(
    (
      await call(
        `/api/messages?mode=practice&conversationId=${conversationId}`,
        { token: aliceToken },
      )
    ).status,
    404,
  );
});
test("memory confirmation/correction retains creation time and leaves Pending; provenance cascade deletes", async () => {
  assert.equal(
    (
      await call(`/api/facts/${fact.id}`, {
        method: "PATCH",
        token: aliceToken,
        body: { reviewed: true },
      })
    ).status,
    200,
  );
  assert.equal(
    (await call("/api/facts?reviewed=false", { token: aliceToken })).body.facts
      .length,
    0,
  );
  const corrected = await call(`/api/facts/${fact.id}`, {
    method: "PATCH",
    token: aliceToken,
    body: { object: "painting" },
  });
  assert.equal(corrected.body.fact.createdAt, fact.createdAt);
  assert.equal(corrected.body.fact.reviewed, true);
  assert.equal(
    (
      await call(`/api/conversations/${conversationId}?mode=personal`, {
        method: "DELETE",
        token: aliceToken,
      })
    ).status,
    200,
  );
  assert.equal(
    (await call("/api/facts", { token: aliceToken })).body.facts.length,
    0,
  );
  assert.equal(
    await store.db
      .collection("messages")
      .countDocuments({ tenantId: aliceId, conversationId }),
    0,
  );
});
test("quota reservations remain atomic under concurrent admission and budget rejection", async () => {
  const initial = await store.db
    .collection("usage")
    .findOne({
      tenantId: "__application",
      metric: "aiCents",
      periodStart: new Date().toISOString().slice(0, 7),
    });
  const limited = createUsage(store, {
    ...config,
    MONTHLY_AI_LIMIT_CENTS: (initial?.value || 0) + 10,
  });
  const owner = `quota-${run}`;
  const results = await Promise.allSettled(
    Array.from({ length: 8 }, () => limited.reserveChat(owner)),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 2);
  const used = await limited.status(owner);
  assert.equal(
    used.chatUsed,
    2,
    "Rejected budget transactions must not consume daily chat count.",
  );
});
test("forgot-password responses do not enumerate users; OTP resets revoke all old sessions", async () => {
  const known = await call("/api/account/forgot-password", {
    method: "POST",
    body: { email: alice },
  });
  const unknown = await call("/api/account/forgot-password", {
    method: "POST",
    body: { email: `missing-${run}@example.test` },
  });
  assert.deepEqual(known.body, unknown.body);
  const code = await mailCode(alice, "Reset your Victor password");
  const reset = await call("/api/account/reset-password", {
    method: "POST",
    body: { email: alice, code, password: newPassword },
  });
  assert.equal(reset.status, 200, JSON.stringify(reset.body));
  assert.equal((await call("/api/me", { token: aliceToken })).status, 401);
  assert.equal(
    (
      await call("/api/account/reset-password", {
        method: "POST",
        body: { email: alice, code, password },
      })
    ).status,
    400,
  );
  const login = await call("/api/auth/sign-in/email", {
    method: "POST",
    body: { email: alice, password: newPassword },
    native: true,
    origin: null,
  });
  assert.equal(login.status, 200);
  aliceToken = login.token;
});
test("current-password change and replacement recovery codes require reauthentication", async () => {
  assert.equal(
    (
      await call("/api/account/recovery-codes", {
        method: "POST",
        token: aliceToken,
        body: { password: "wrong" },
      })
    ).status,
    400,
  );
  const changed = await call("/api/account/change-password", {
    method: "POST",
    token: aliceToken,
    body: { currentPassword: newPassword, newPassword: password },
  });
  assert.equal(changed.status, 200, JSON.stringify(changed.body));
  assert.equal((await call("/api/me", { token: aliceToken })).status, 401);
  aliceToken = changed.token;
  assert.ok(aliceToken);
  const codes = await call("/api/account/recovery-codes", {
    method: "POST",
    token: aliceToken,
    body: { password },
  });
  assert.equal(codes.status, 200, JSON.stringify(codes.body));
  assert.equal(codes.body.recoveryCodes.length, 10);
  const old = await call("/api/account/recover", {
    method: "POST",
    body: { email: alice, code: backupCodes[0], password: newPassword },
  });
  assert.equal(old.status, 400);
  const recovered = await call("/api/account/recover", {
    method: "POST",
    body: {
      email: alice,
      code: codes.body.recoveryCodes[0],
      password: newPassword,
    },
  });
  assert.equal(recovered.status, 200, JSON.stringify(recovered.body));
  assert.equal((await call("/api/me", { token: aliceToken })).status, 401);
  assert.equal(
    (
      await call("/api/account/recover", {
        method: "POST",
        body: { email: alice, code: codes.body.recoveryCodes[0], password },
      })
    ).status,
    400,
  );
});
test("OTP attempt cap and application expiry checks hold even before TTL cleanup", async () => {
  const email = `cap-${run}@example.test`;
  await call("/api/account/register", { method: "POST", body: { email } });
  const code = await mailCode(email);
  for (let i = 0; i < 5; i++)
    assert.equal(
      (
        await call("/api/account/verify-registration", {
          method: "POST",
          body: { email, code: "000000", password, name: "Cap" },
        })
      ).status,
      400,
    );
  assert.equal(
    (
      await call("/api/account/verify-registration", {
        method: "POST",
        body: { email, code, password, name: "Cap" },
      })
    ).status,
    400,
  );
  await store.db
    .collection("challenges")
    .updateOne(
      { email },
      { $set: { attempts: 0, expiresAt: new Date(Date.now() - 1000) } },
    );
  assert.equal(
    (
      await call("/api/account/verify-registration", {
        method: "POST",
        body: { email, code, password, name: "Cap" },
      })
    ).status,
    400,
  );
});
test("seek pagination handles timestamp ties and uses the tenant index",async()=>{
  const tenant={id:aliceId},id=await runtime.assistant.createConversation(tenant,'personal'),stamp=new Date();
  const rows=Array.from({length:105},()=>({_id:randomUUID(),tenantId:aliceId,mode:'personal',sourceConversationId:id,subject:'Fixture',predicate:'has',object:'a color',confidence:0.9,reviewed:false,createdAt:stamp,updatedAt:stamp}));
  await store.db.collection('facts').insertMany(rows);
  const first=await runtime.assistant.listFacts(tenant,{}),second=await runtime.assistant.listFacts(tenant,{cursor:first.nextCursor});
  assert.equal(first.facts.length,100);assert.equal(second.facts.length,5);assert.equal(new Set([...first.facts,...second.facts].map(f=>f.id)).size,105);
  const plan=await store.db.collection('facts').find({tenantId:aliceId,mode:'personal',reviewed:false}).sort({createdAt:-1,_id:-1}).limit(100).explain('executionStats');
  assert.match(JSON.stringify(plan.queryPlanner.winningPlan),/IXSCAN/);assert.ok(plan.executionStats.totalDocsExamined<=100);
  await runtime.assistant.deleteConversation(tenant,'personal',id);
});
test("expired sessions are rejected before asynchronous database TTL deletion",async()=>{
  const response=await runtime.identity.auth.api.signInEmail({body:{email:alice,password:newPassword},asResponse:true}),token=response.headers.get('set-auth-token');
  const headers=new Headers({authorization:`Bearer ${token}`}),active=await runtime.identity.auth.api.getSession({headers});assert.ok(active);
  await store.db.collection('session').updateOne({token:active.session.token},{$set:{expiresAt:new Date(Date.now()-1000)}});
  assert.equal(await runtime.identity.auth.api.getSession({headers}),null);
});
test("application-wide email admission caps delivery across accounts",async()=>{
  const limited=createMailer(store,{...config,AUTH_SECRET:`mail-cap-${run}`,DAILY_EMAIL_LIMIT:1});
  try{assert.equal(await limited.queue(`mail-cap-${run}@example.test`,'Local cap fixture','Synthetic local message'),true);assert.equal(await limited.queue(`other-${run}@example.test`,'Local cap fixture','Synthetic local message'),false);}finally{limited.close();}
});
test("WebSocket authentication rejects invalid sessions before speech or quota use", async () => {
  const ws = new WebSocket(base.replace("http:", "ws:") + "/voice");
  await once(ws, "open");
  ws.send(
    JSON.stringify({ type: "start", token: "invalid", mode: "personal" }),
  );
  const [code] = await once(ws, "close");
  assert.equal(code, 1008);
});
test("authenticated voice uses one distributed lease, speaks an owned reply, and stops after logout", async () => {
  const waitFor = (ws, type) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        ws.off("message", handler);
        reject(new Error(`No voice ${type}`));
      }, 7000);
      function handler(bytes) {
        const event = JSON.parse(bytes.toString());
        if (event.type === type) {
          clearTimeout(timer);
          ws.off("message", handler);
          resolve(event);
        }
      }
      ws.on("message", handler);
    });
  const ws = new WebSocket(base.replace("http:", "ws:") + "/voice");
  await once(ws, "open");
  const ready = waitFor(ws, "ready");
  ws.send(JSON.stringify({ type: "start", token: bobToken, mode: "practice" }));
  await ready;
  const second = new WebSocket(base.replace("http:", "ws:") + "/voice");
  await once(second, "open");
  const denied = once(second, "close");
  second.send(
    JSON.stringify({ type: "start", token: bobToken, mode: "practice" }),
  );
  assert.equal((await denied)[0], 1008);
  const reply = waitFor(ws, "reply"),
    audio = waitFor(ws, "audio");
  listeners.at(-1)({
    event: "transcript.final",
    text: "A harmless voice fixture",
  });
  const answer = await reply;
  assert.equal(typeof answer.reply.createdAt, "string");
  assert.ok((await audio).audio.length > 0);
  const ended = once(ws, "close");
  await runtime.identity.auth.api.signOut({
    headers: new Headers({ authorization: `Bearer ${bobToken}` }),
  });
  assert.equal((await ended)[0], 1008);
  const user = await store.db.collection("user").findOne({ email: bob });
  assert.equal(await store.redis.get(`voice:${user._id}`), null);
});

test("paused personal voice keeps earlier facts/history when a newer statement interrupts its reply", async () => {
  const email=`voice-retention-${run}@example.test`;
  // A distinct synthetic client avoids consuming the auth-abuse fixture's
  // per-IP allowance. Production limits are unchanged.
  const clientIp='192.0.2.20';
  const registration=await call('/api/account/register',{method:'POST',body:{email},clientIp});
  assert.equal(registration.status,200);
  const code=await mailCode(email);
  const registered=await call('/api/account/verify-registration',{method:'POST',body:{email,code,password,name:'Voice retention test'},clientIp});
  assert.equal(registered.status,200);
  const login=await call('/api/auth/sign-in/email',{method:'POST',body:{email,password},native:true,origin:null,clientIp});
  assert.equal(login.status,200);
  assert.ok(login.token?.includes('.'),'Signed native session required by retention socket');
  const ws=new WebSocket(base.replace('http:','ws:')+'/voice');
  const waitFor=type=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('No retention '+type)),7000);
    const handler=bytes=>{const event=JSON.parse(bytes);if(event.type===type){clearTimeout(timer);ws.off('message',handler);resolve(event);}};
    ws.on('message',handler);
  });
  try {
    await once(ws,'open');const ready=waitFor('ready');
    ws.send(JSON.stringify({type:'start',token:login.token,mode:'personal'}));await ready;
    const emit=listeners.at(-1),reply=waitFor('reply');
    emit({event:'vad.speech_start',owner:'backend',utteranceId:1,pendingTranscripts:0,speechActive:true});
    emit({event:'vad.speech_end',owner:'backend',utteranceId:1,pendingTranscripts:1,speechActive:false});
    emit({event:'transcript.final',utteranceId:1,text:'I prefer green tea.',pendingTranscripts:0,speechActive:false});
    emit({event:'vad.speech_start',owner:'backend',utteranceId:2,pendingTranscripts:0,speechActive:true});
    emit({event:'vad.speech_end',owner:'backend',utteranceId:2,pendingTranscripts:1,speechActive:false});
    emit({event:'transcript.final',utteranceId:2,text:'I enjoy hiking.',pendingTranscripts:0,speechActive:false});
    const answer=await reply;
    const user=await store.db.collection('user').findOne({email});
    const messages=await store.db.collection('messages').find({tenantId:String(user._id),conversationId:answer.conversationId,role:'user'}).sort({createdAt:1}).toArray();
    assert.deepEqual(messages.map(message=>message.content),['I prefer green tea.','I enjoy hiking.']);
    const saved=await store.db.collection('facts').find({tenantId:String(user._id)}).toArray();
    assert.deepEqual(saved.map(fact=>fact.object).sort(),['I enjoy hiking.','I prefer green tea.']);
    assert(seen.some(input=>input.content==='I enjoy hiking.'&&input.prior.some(message=>message.content==='I prefer green tea.')));
    emit({event:'transcript.final',utteranceId:2,text:'I enjoy hiking.',pendingTranscripts:0,speechActive:false});
    await new Promise(resolve=>setTimeout(resolve,30));
    assert.equal(await store.db.collection('messages').countDocuments({tenantId:String(user._id),role:'user'}),2);
  } finally {
    ws.close();
    await runtime.identity.auth.api.signOut({headers:new Headers({authorization:`Bearer ${login.token}`})});
  }
});

test('authenticated held voice commits only after release through the same tenant-scoped chat path',async()=>{
  const email=`voice-held-${run}@example.test`,clientIp='192.0.2.21';
  assert.equal((await call('/api/account/register',{method:'POST',body:{email},clientIp})).status,200);
  const code=await mailCode(email);
  assert.equal((await call('/api/account/verify-registration',{method:'POST',body:{email,code,password,name:'Held voice test'},clientIp})).status,200);
  const login=await call('/api/auth/sign-in/email',{method:'POST',body:{email,password},native:true,origin:null,clientIp});assert.equal(login.status,200);
  const ws=new WebSocket(base.replace('http:','ws:')+'/voice');
  const waitFor=type=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{ws.off('message',handler);reject(Error('No held '+type));},7000);
    function handler(raw){const e=JSON.parse(raw);if(e.type===type){clearTimeout(timer);ws.off('message',handler);resolve(e);}}
    ws.on('message',handler);
  });
  try{
    await once(ws,'open');const ready=waitFor('ready');
    ws.send(JSON.stringify({type:'start',token:login.token,mode:'personal',inputMode:'push-to-talk'}));await ready;
    const user=await store.db.collection('user').findOne({email}),priorCalls=seen.length,emit=listeners.at(-1);
    emit({event:'transcript.final',text:'I prefer tea.',utteranceId:1,speechActive:false,pendingTranscripts:0});
    emit({event:'transcript.final',text:'I enjoy hiking.',utteranceId:2,speechActive:false,pendingTranscripts:0});
    assert.equal(seen.length,priorCalls);assert.equal(await store.db.collection('messages').countDocuments({tenantId:String(user._id)}),0);
    const reply=waitFor('reply');ws.send(JSON.stringify({type:'finishInput'}));const answer=await reply;
    assert.equal(seen.length,priorCalls+1);
    const messages=await store.db.collection('messages').find({tenantId:String(user._id),conversationId:answer.conversationId,role:'user'}).toArray();
    assert.equal(messages.length,1);assert.equal(messages[0].content,'I prefer tea.\nI enjoy hiking.');
  }finally{ws.close();await runtime.identity.auth.api.signOut({headers:new Headers({authorization:`Bearer ${login.token}`})});}
});
