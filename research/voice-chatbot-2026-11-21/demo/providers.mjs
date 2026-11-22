import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const requireApi = createRequire(new URL('../../../services/api/package.json', import.meta.url));
export const { WebSocket } = requireApi('ws');
export const LIVE_MODEL = 'gpt-live-1.1';

// Read only the selected provider configuration. Never return it to a client.
export async function loadProviderConfig() {
  const config = {};
  let source = '';
  try { source = await readFile(new URL('../../../../PersonnelAssistant.env', import.meta.url), 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('Cannot read local provider configuration.'); }
  for (const key of ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY']) {
    let value = process.env[key];
    if (!value) {
      const line = source.split(/\r?\n/).find(item => item.trimStart().startsWith(`${key}=`));
      value = line?.trim().slice(key.length + 1).trim();
      if (value?.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      else if (value?.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    }
    config[key] = value || '';
  }
  return config;
}

export const instructions = 'You are Victor in a short isolated voice research demo. Be warm, concise and natural. Do not claim access to personal records. For order status or any factual task, ask the backend for help. It contains only a fictional TEST-ALPHA order and simple arithmetic. You can keep listening while it works. Never describe an action as completed unless the backend verifies it.';

export function fixtureResult(text) {
  if (/TEST[ -]?ALPHA/i.test(text)) return 'Verified fictional fixture: order TEST-ALPHA has shipped. No real order was queried.';
  if (/(twelve|12).*(thirteen|13)|(thirteen|13).*(twelve|12)/i.test(text)) return 'Verified arithmetic result: twelve times thirteen is one hundred and fifty-six.';
  return 'This isolated demo has no personal database or external tools. It can verify order TEST-ALPHA or twelve times thirteen; ask which fixture the user wants.';
}

export function startFixtureCoordinator(socket, emit = () => {}, delayMs = 600) {
  let transcript = '', closed = false;
  const seen = new Set(), pending = new Set();
  const onMessage = raw => {
    let event;
    try { event = JSON.parse(raw.toString()); } catch { return; }
    if (event.type === 'session.input_transcript.delta') transcript = (transcript + event.delta).slice(-8000);
    if (event.type === 'session.delegation.created' && event.delegation?.target === 'client') {
      const id = event.delegation.id;
      if (!id || seen.has(id) || closed) return;
      seen.add(id);
      emit({ type: 'task', state: 'running', label: 'Checking the isolated backend fixture' });
      const snapshot = transcript;
      const timer = setTimeout(() => {
        pending.delete(timer);
        if (closed || socket.readyState !== 1) return;
        socket.send(JSON.stringify({ type: 'session.commentary.append', delegation_id: id, content: fixtureResult(snapshot) }));
        emit({ type: 'task', state: 'completed', label: 'Fixture result returned; no production data accessed' });
      }, delayMs);
      pending.add(timer);
    }
    if (event.type === 'error') emit({ type: 'provider_error', label: 'Provider rejected a demo session event.' });
  };
  socket.on('message', onMessage);
  return () => { closed = true; for (const timer of pending) clearTimeout(timer); socket.off('message', onMessage); };
}

export async function createLiveSession(apiKey, sdp) {
  const response = await fetch('https://api.openai.com/v1/live/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session: { model: LIVE_MODEL, instructions, delegation: { type: 'client' }, store: false },
      transport: { type: 'webrtc', sdp },
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    const error = new Error(`OpenAI session setup returned HTTP ${response.status}. Check model access and API availability.`);
    error.status = response.status;
    throw error;
  }
  const result = await response.json();
  if (typeof result.session?.id !== 'string' || typeof result.transport?.sdp !== 'string') {
    throw new Error('Provider session response did not match the documented Live protocol.');
  }
  return { sessionId: result.session.id, sdp: result.transport.sdp, model: LIVE_MODEL };
}
