import { ScenarioRunner } from './scenario.js';

const $ = id => document.getElementById(id);
let plan = 'a', mode = 'simulation', muted = false, config = {}, generation = 0;
let peer, microphone, channel, poll, liveDeadline, sessionActive = false;
const states = {
  listening: ['I’m listening.', 'Keep talking naturally; the conversation stays open.'],
  thinking: ['Working on it.', 'The backend handles the task while the voice session stays open.'],
  speaking: ['Victor is responding.', 'You can interrupt or stop playback at any time.'],
  complete: ['Ready for another turn.', 'That was a scripted interaction, not a provider benchmark.'],
  muted: ['Reply muted.', 'The caption is available; spoken output is muted locally.'],
  connecting: ['Opening a live session.', 'Requesting microphone access and negotiating WebRTC.'],
};
function notice(text) { $('notice').textContent = text; $('notice').hidden = !text; }
function event(text) {
  const list = $('events');
  if (list.firstElementChild?.textContent === 'Waiting for a session') list.replaceChildren();
  const item = document.createElement('li'); item.textContent = text; list.append(item);
  while (list.children.length > 10) list.firstElementChild.remove();
  list.scrollTop = list.scrollHeight;
}
function state(value, detail) {
  const [title, explanation] = states[value] || ['Ready when you are.', 'Choose a scenario to see how Victor listens, works and yields.'];
  $('state-label').textContent = title; $('state-detail').textContent = detail || explanation;
  $('voice-stage').classList.toggle('active', ['listening', 'thinking', 'speaking', 'connecting'].includes(value));
  if (value === 'complete') $('interrupt').disabled = true;
}
function caption(role, text, delta = false) {
  const list = $('messages'); list.querySelector('.empty')?.remove();
  let item = delta && list.lastElementChild?.dataset.role === role ? list.lastElementChild : null;
  if (!item) {
    item = document.createElement('div'); item.className = `message ${role}`; item.dataset.role = role;
    const label = document.createElement('strong'); label.textContent = role === 'user' ? 'YOU' : 'VICTOR';
    const body = document.createElement('span'); item.append(label, body); list.append(item);
  }
  const body = item.querySelector('span'); body.textContent = delta ? body.textContent + text : text;
  list.scrollTop = list.scrollHeight;
}
const runner = new ScenarioRunner(message => {
  if (message.type === 'state') { state(message.value); event(`Scenario: ${message.value}`); }
  if (message.type === 'caption') caption(message.role, message.text);
  if (message.type === 'task') event(message.text);
});

async function api(path, body) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Action': 'voice-demo' }, body: JSON.stringify(body || {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Demo request failed.');
  return result;
}
function stopMedia() {
  clearInterval(poll); clearTimeout(liveDeadline);
  microphone?.getTracks().forEach(track => track.stop()); microphone = null;
  $('remote-audio').pause(); $('remote-audio').srcObject = null;
  if (channel?.readyState === 'open') channel.send(JSON.stringify({ type: 'session.close' }));
  channel?.close(); channel = null; peer?.close(); peer = null;
}
async function stop(reason = 'Stopped locally') {
  generation++; runner.stop(reason); stopMedia();
  if (sessionActive) { sessionActive = false; await api('/api/close').catch(() => {}); }
  $('interrupt').disabled = true; $('start').disabled = mode === 'live' && (plan === 'b' || !config.openaiConfigured);
  $('start').textContent = mode === 'live' ? 'Start live session' : 'Start scenario';
  state('idle'); event(reason);
}
function updateMode() {
  $('simulation-mode').classList.toggle('selected', mode === 'simulation');
  $('live-mode').classList.toggle('selected', mode === 'live');
  $('simulation-mode').setAttribute('aria-pressed', String(mode === 'simulation'));
  $('live-mode').setAttribute('aria-pressed', String(mode === 'live'));
  $('mode-badge').textContent = mode === 'simulation' ? 'Scenario simulation' : plan === 'a' ? 'Live provider' : 'Setup pending';
  $('scenario-row').hidden = mode === 'live';
  $('start').textContent = mode === 'live' ? 'Start live session' : 'Start scenario';
  $('start').disabled = mode === 'live' && (plan === 'b' || !config.openaiConfigured);
  $('mode-note').textContent = mode === 'simulation'
    ? 'Scripted UI demo. No microphone, provider call or vendor latency measurement.'
    : plan === 'a'
      ? 'Real OpenAI audio; local fixture backend only. Microphone streams to the provider for up to 2 minutes. Nothing is saved by this lab.'
      : 'The Gemini / LiveKit service and agent worker need setup before real audio can be tested. Scenario mode is available.';
  $('measurement-note').textContent = mode === 'simulation'
    ? 'Scenario delays are prescribed and identical for both plans. They cannot rank providers.'
    : 'A live session can test listening and playback. Calibrated useful-answer and interruption timing still need the benchmark harness.';
  if (mode === 'live' && plan === 'b') notice(config.secondaryReason);
  else if (mode === 'live' && !config.openaiConfigured) notice('Configure OPENAI_API_KEY privately on the local server, then restart it. Never paste a key into this screen.');
  else notice('');
}
async function live() {
  await stop('Preparing live session');
  const current = ++generation;
  $('start').disabled = true; $('interrupt').disabled = false; $('interrupt').textContent = 'Stop session'; state('connecting'); notice('');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
    if (current !== generation) { stream.getTracks().forEach(track => track.stop()); return; }
    microphone = stream;
    const pc = new RTCPeerConnection(); peer = pc;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    const dc = pc.createDataChannel('oai-events'); channel = dc;
    pc.ontrack = e => { if (current !== generation) return; $('remote-audio').srcObject = e.streams[0]; $('remote-audio').muted = muted; $('remote-audio').play().catch(() => notice('Playback needs another browser gesture. Tap the page and try again.')); };
    dc.onmessage = e => {
      if (current !== generation) return;
      let message; try { message = JSON.parse(e.data); } catch { return; }
      if (message.type === 'session.started') { state('listening', 'Ask about fictional order TEST-ALPHA, or ask “What is twelve times thirteen?”'); event('Live model connected'); }
      if (message.type === 'session.input_transcript.delta') caption('user', message.delta || '', true);
      if (message.type === 'session.output_transcript.delta') { caption('assistant', message.delta || '', true); state(muted ? 'muted' : 'speaking'); }
      if (message.type === 'session.delegation.created') { state('thinking'); event('The live model delegated a task'); }
      if (message.type === 'session.closed') { notice('The live provider session ended.'); void stop('Live session closed'); }
      if (message.type === 'error') { notice('The provider rejected a session event. Stop the session and inspect the test report.'); event('Provider event error'); }
    };
    pc.onconnectionstatechange = () => { if (current === generation && ['failed', 'disconnected'].includes(pc.connectionState)) { notice('The live media connection disconnected. Start a new session to reconnect.'); void stop('Media disconnected'); } };
    await pc.setLocalDescription(await pc.createOffer());
    if (pc.iceGatheringState !== 'complete') await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WebRTC network discovery timed out.')), 10000);
      pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(timer); resolve(); } });
    });
    if (current !== generation) return;
    const result = await api('/api/live', { sdp: pc.localDescription.sdp });
    if (current !== generation) { await api('/api/close'); return; }
    sessionActive = true;
    await pc.setRemoteDescription({ type: 'answer', sdp: result.sdp });
    $('start').textContent = 'Live session active';
    liveDeadline = setTimeout(() => void stop('Two-minute demo session ended'), result.maxSessionSeconds * 1000);
    let seen = 0;
    poll = setInterval(async () => {
      try { const result = await fetch('/api/session').then(r => r.json()); if (current !== generation) return; for (const item of result.events.slice(seen)) event(item.label); seen = result.events.length; } catch {}
    }, 700);
  } catch (error) {
    if (current !== generation) return;
    await stop('Live setup stopped');
    notice(error.name === 'NotAllowedError' ? 'Microphone permission was denied. No live audio session started.' : error.message);
  }
}

$('start').onclick = () => {
  if (mode === 'live') { void live(); return; }
  notice('Scenario timings are scripted. This run does not contact either provider.');
  $('interrupt').disabled = false; $('interrupt').textContent = 'Interrupt';
  runner.run($('scenario').value, muted);
};
$('interrupt').onclick = async () => { await stop(mode === 'live' ? 'Live session stopped locally' : 'Scenario interrupted; obsolete events discarded'); notice(mode === 'simulation' ? 'The scripted response was cancelled. This checks UI state, not cloud barge-in latency.' : 'Microphone and playback stopped.'); };
$('mute').onclick = () => { muted = !muted; $('mute').setAttribute('aria-pressed', String(muted)); $('mute').textContent = muted ? 'Unmute reply' : 'Mute reply'; $('remote-audio').muted = muted; event(muted ? 'Local output muted' : 'Local output unmuted'); };
$('reset').onclick = async () => { await stop('Demo reset'); $('messages').innerHTML = '<p class="empty">Your conversation will appear here.</p>'; $('events').innerHTML = '<li>Waiting for a session</li>'; muted = false; $('mute').setAttribute('aria-pressed', 'false'); $('mute').textContent = 'Mute reply'; updateMode(); };
for (const value of ['simulation', 'live']) $(`${value}-mode`).onclick = async () => { await stop('Demo mode changed'); mode = value; $('interrupt').textContent = value === 'live' ? 'Stop session' : 'Interrupt'; updateMode(); };
document.querySelectorAll('[data-plan]').forEach(button => button.onclick = async () => {
  await stop('Architecture changed'); plan = button.dataset.plan;
  document.querySelectorAll('[data-plan]').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
  $('session-title').textContent = plan === 'a' ? 'Continuous conversation' : 'Managed voice agent';
  $('route-title').textContent = plan === 'a' ? 'A voice that keeps listening.' : 'One managed media layer.';
  const steps = plan === 'a' ? ['Web or Android audio', 'OpenAI live voice session', 'Private backend reasoning and tools'] : ['LiveKit web or Android SDK', 'LiveKit room and Node agent worker', 'Gemini Live with backend tools'];
  $('route').replaceChildren(...steps.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
  $('route-note').textContent = plan === 'a' ? 'Audio takes the direct path. The backend works independently.' : 'The server worker owns the voice session; both clients share the same tools.';
  updateMode();
});
window.addEventListener('pagehide', () => { generation++; runner.stop(); stopMedia(); if (sessionActive) fetch('/api/close', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Action': 'voice-demo' }, body: '{}', keepalive: true }).catch(() => {}); });
try {
  config = await fetch('/api/config').then(response => response.json());
  $('provider-status').textContent = config.openaiConfigured ? 'OpenAI key detected on server · model access not yet verified' : 'Live provider configuration pending · scenarios ready';
} catch { $('provider-status').textContent = 'Local server unavailable · restart the voice lab'; }
updateMode();
