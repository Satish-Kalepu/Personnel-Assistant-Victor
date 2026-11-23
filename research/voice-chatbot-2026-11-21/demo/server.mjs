import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadProviderConfig, createLiveSession, startFixtureCoordinator, WebSocket, LIVE_MODEL } from './providers.mjs';

export function makeLabServer(config, port = 4317) {
  const sessions = new Map();
  const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  const origins = new Set([...hosts].map(host => `http://${host}`));
  const assets = new Map([
    ['/', ['index.html', 'text/html']], ['/index.html', ['index.html', 'text/html']],
    ['/app.js', ['app.js', 'text/javascript']], ['/style.css', ['style.css', 'text/css']],
    ['/scenario.js', ['scenario.js', 'text/javascript']],
  ]);
  let creating = false;
  function closeSession(entry) {
    if (!entry) return;
    clearTimeout(entry.timer); entry.coordinator?.();
    if (entry.socket?.readyState === 1) {
      entry.socket.send(JSON.stringify({ type: 'session.close' }));
      const timer = setTimeout(() => entry.socket.terminate(), 5000); timer.unref();
    } else entry.socket?.terminate();
    sessions.delete(entry.owner);
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; media-src 'self' blob:; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (!hosts.has(req.headers.host)) return json(403, { error: 'Loopback host required.' });
    const path = new URL(req.url, `http://${req.headers.host}`).pathname;
    let owner = /(?:^|;\s*)voice_lab=([a-f0-9-]+)/.exec(req.headers.cookie || '')?.[1];
    if (!owner) {
      owner = randomUUID();
      res.setHeader('Set-Cookie', `voice_lab=${owner}; HttpOnly; SameSite=Strict; Path=/`);
    }
    try {
      if (req.method === 'GET' && path === '/api/config') return json(200, {
        openaiConfigured: Boolean(config.OPENAI_API_KEY), model: LIVE_MODEL,
        secondaryLiveReady: false,
        secondaryReason: 'Gemini/LiveKit media service and worker are not provisioned in this isolated lab.',
        isolation: 'Local demo only. No production accounts, databases or memory.', maxSessionSeconds: 120,
      });
      if (req.method === 'GET' && path === '/api/session') {
        const entry = sessions.get(owner);
        return json(200, { events: entry?.events || [], active: Boolean(entry) });
      }
      if (req.method === 'POST') {
        if (!origins.has(req.headers.origin) || req.headers['x-lab-action'] !== 'voice-demo') return json(403, { error: 'Same-origin demo request required.' });
        if (!req.headers['content-type']?.startsWith('application/json')) return json(415, { error: 'JSON required.' });
        if (path === '/api/close') { closeSession(sessions.get(owner)); return json(200, { closed: true }); }
        if (path !== '/api/live') return json(404, { error: 'Unknown demo endpoint.' });
        if (!config.OPENAI_API_KEY) return json(503, { error: 'OpenAI key is not configured on the local server.' });
        if (sessions.size || creating) return json(409, { error: 'One isolated live demo at a time. Stop the active session first.' });
        let body = '', bytes = 0;
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 65536) return json(413, { error: 'Session offer too large.' });
          body += chunk;
        }
        let input;
        try { input = JSON.parse(body); } catch { return json(400, { error: 'Invalid JSON.' }); }
        if (typeof input.sdp !== 'string' || !input.sdp.startsWith('v=0')) return json(400, { error: 'A valid WebRTC offer is required.' });
        creating = true;
        try {
          const live = await createLiveSession(config.OPENAI_API_KEY, input.sdp);
          const events = [];
          const socket = new WebSocket(`wss://api.openai.com/v1/live/sessions/${encodeURIComponent(live.sessionId)}/attach`, {
            headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}` }, handshakeTimeout: 10000,
          });
          const entry = { owner, socket, events };
          entry.coordinator = startFixtureCoordinator(socket, event => { events.push(event); if (events.length > 40) events.shift(); });
          socket.on('error', () => events.push({ type: 'provider_error', label: 'Private backend connection failed; stop and reconnect.' }));
          socket.on('message', raw => {
            try { if (JSON.parse(raw.toString()).type === 'session.closed') closeSession(entry); } catch {}
          });
          entry.timer = setTimeout(() => closeSession(entry), 120000); entry.timer.unref();
          sessions.set(owner, entry);
          return json(201, { ...live, maxSessionSeconds: 120, fixtureOnly: true });
        } finally { creating = false; }
      }
      if (req.method === 'GET' && assets.has(path)) {
        const [file, type] = assets.get(path);
        const bytes = await readFile(new URL(`public/${file}`, import.meta.url));
        res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` }); return res.end(bytes);
      }
      return json(404, { error: 'Not found.' });
    } catch (error) {
      return json(502, { error: error.status ? error.message : 'Local demo could not complete provider setup. No production changes were made.' });
    }
  });
  server.closeLabSessions = () => { for (const entry of sessions.values()) closeSession(entry); };
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.LAB_PORT || 4317);
  const config = await loadProviderConfig();
  const server = makeLabServer(config, port);
  server.listen(port, '127.0.0.1', () => console.log(`Voice lab: http://127.0.0.1:${port}`));
  const stop = () => { server.closeLabSessions(); server.close(() => process.exit(0)); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
