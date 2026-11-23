import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { ScenarioRunner } from '../public/scenario.js';
import { startFixtureCoordinator } from '../providers.mjs';
import { makeLabServer } from '../server.mjs';
import { FirstAudioTiming } from '../audio-timing.mjs';

test('first audio before input end stays negative even if later chunks arrive', () => {
  const timing = new FirstAudioTiming();
  timing.audio(200); timing.endInput(400); timing.audio(468);
  assert.equal(timing.summary().firstReceivedAudioMinusInputEndMs, -200);
  assert.equal(timing.summary().firstAudioBeforeInputEnd, true);
});

test('unknown input end never becomes zero latency and first chunk never moves', () => {
  const timing = new FirstAudioTiming();
  timing.audio(200);
  assert.equal(timing.summary().firstReceivedAudioMinusInputEndMs, null);
  const later = new FirstAudioTiming();
  later.endInput(100); later.audio(250); later.audio(300); later.endInput(400);
  assert.equal(later.summary().firstReceivedAudioMinusInputEndMs, 150);
});

test('interrupt and architecture switch cannot emit a stale scripted reply', () => {
  const scheduled = new Map(); let id = 0;
  const clock = { setTimeout(fn) { scheduled.set(++id, fn); return id; }, clearTimeout(key) { scheduled.delete(key); } };
  const events = [], runner = new ScenarioRunner(event => events.push(event), clock);
  runner.run('lookup');
  const lateCallbacks = [...scheduled.values()];
  runner.stop('architecture changed');
  for (const callback of lateCallbacks) callback();
  assert.equal(events.filter(event => event.type === 'caption').length, 0);
  assert.equal(scheduled.size, 0);
});

test('replayed delegation cannot execute the fixture twice; stopped work cannot return', async () => {
  const socket = new EventEmitter(); socket.readyState = 1;
  const sent = []; socket.send = body => sent.push(JSON.parse(body));
  const stop = startFixtureCoordinator(socket, () => {}, 5);
  socket.emit('message', JSON.stringify({ type: 'session.input_transcript.delta', delta: 'Order TEST-ALPHA' }));
  const delegation = JSON.stringify({ type: 'session.delegation.created', delegation: { id: 'fixture-1', target: 'client' } });
  socket.emit('message', delegation); socket.emit('message', delegation);
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(sent.length, 1); assert.match(sent[0].content, /has shipped/);
  socket.emit('message', JSON.stringify({ type: 'session.delegation.created', delegation: { id: 'fixture-2', target: 'client' } }));
  stop(); await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(sent.length, 1);
});

test('local HTTP surface never exposes secrets, source files or cross-origin mutations', async () => {
  const server = makeLabServer({ OPENAI_API_KEY: 'fixture-secret-not-a-real-key' }, 4318);
  await new Promise(resolve => server.listen(4318, '127.0.0.1', resolve));
  try {
    const config = await fetch('http://127.0.0.1:4318/api/config').then(r => r.text());
    assert.equal(config.includes('fixture-secret'), false);
    assert.equal(JSON.parse(config).openaiConfigured, true);
    assert.equal((await fetch('http://127.0.0.1:4318/.env')).status, 404);
    assert.equal((await fetch('http://127.0.0.1:4318/providers.mjs')).status, 404);
    assert.equal((await fetch('http://127.0.0.1:4318/api/close', { method: 'POST', headers: { Origin: 'https://foreign.example', 'X-Lab-Action': 'voice-demo', 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
    assert.equal((await fetch('http://127.0.0.1:4318/api/live', { method: 'POST', headers: { Origin: 'http://127.0.0.1:4318', 'X-Lab-Action': 'voice-demo', 'Content-Type': 'application/json' }, body: '{"sdp":"invalid"}' })).status, 400);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
