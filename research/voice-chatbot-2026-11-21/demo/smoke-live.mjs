// One short, synthetic-only provider experiment. Never reads a microphone or DB.
import { writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { loadProviderConfig, WebSocket, LIVE_MODEL, instructions, startFixtureCoordinator } from './providers.mjs';
import { FirstAudioTiming } from './audio-timing.mjs';

const config = await loadProviderConfig();
const report = {
  date: '2026-11-21', candidate: 'OpenAI Live primary WebSocket protocol smoke', model: LIVE_MODEL,
  input: 'Synthetic TTS: What is twelve times thirteen?', microphoneUsed: false,
  productionDataAccessed: false, deviceAcousticLatencyMeasured: false,
  status: 'not_run', stage: 'configuration', sessionStarted: false, outputAudioBytes: 0,
  inputTranscript: '', outputTranscript: '', timing: null, eventTypes: {},
  answerCorrectness: { status: 'unscored', reason: 'Received audio alone does not verify a correct useful answer.' },
  finalizedUsageReceived: false, limitations: [
    'This tests the server WebSocket protocol, not browser WebRTC or Pixel audio.',
    'First received PCM is not audible onset or an end-to-end quality benchmark.',
    'No raw audio is saved. No provider winner follows from one fixture.'
  ],
};
if (!config.OPENAI_API_KEY) report.status = 'missing_configuration';
else {
  await new Promise(resolve => {
    let finished = false, closing = false, streamTimer, closeTimer;
    const timing = new FirstAudioTiming();
    const socket = new WebSocket('wss://api.openai.com/v1/live/sessions', {
      headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}` }, handshakeTimeout: 12000,
    });
    const coordinator = startFixtureCoordinator(socket, () => {}, 100);
    function finish(status) {
      if (finished) return;
      finished = true; report.status = status; report.timing = timing.summary();
      report.expectedAnswerObservedInTranscript = /156|hundred and fifty.six|hundred fifty.six/i.test(report.outputTranscript);
      clearTimeout(deadline); clearTimeout(closeTimer); clearInterval(streamTimer);
      coordinator();
      if ([0, 1].includes(socket.readyState)) socket.terminate();
      resolve();
    }
    function close() {
      if (closing || finished) return;
      closing = true; clearInterval(streamTimer);
      if (socket.readyState === 1) socket.send(JSON.stringify({ type: 'session.close' }));
      closeTimer = setTimeout(() => finish(report.outputAudioBytes ? 'audio_received_finalization_incomplete' : 'no_audio'), 5000);
    }
    const deadline = setTimeout(() => { report.stage = 'timeout'; close(); }, 35000);
    socket.on('unexpected-response', (_req, response) => {
      report.httpStatus = response.statusCode; report.stage = 'websocket_handshake'; response.resume();
      finish('provider_handshake_rejected');
    });
    socket.on('error', () => { report.stage = 'transport'; finish('transport_error'); });
    socket.on('close', () => { if (!finished) finish(report.finalizedUsageReceived && report.outputAudioBytes ? 'audio_received' : 'connection_closed_before_completion'); });
    socket.on('open', () => {
      report.stage = 'session_start';
      socket.send(JSON.stringify({ type: 'session.start', session: {
        model: LIVE_MODEL, instructions, delegation: { type: 'client' }, store: false,
        audio: { format: { type: 'audio/pcm', rate: 24000 }, output: { voice: 'marin' } },
      } }));
    });
    socket.on('message', async raw => {
      if (finished) return;
      let event; try { event = JSON.parse(raw.toString()); } catch { return; }
      report.eventTypes[event.type] = (report.eventTypes[event.type] || 0) + 1;
      if (event.type === 'error') {
        report.providerErrorCode = typeof event.error?.code === 'string' ? event.error.code.slice(0, 80) : 'unspecified';
        report.stage = 'provider_event'; close(); return;
      }
      if (event.type === 'session.started') {
        report.sessionStarted = true; report.stage = 'synthetic_input_generation';
        try {
          const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST', headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: 'alloy', input: 'What is twelve times thirteen?', response_format: 'pcm' }),
            signal: AbortSignal.timeout(12000),
          });
          if (!response.ok) { report.ttsHttpStatus = response.status; close(); return; }
          const pcm = Buffer.from(await response.arrayBuffer());
          if (finished || closing) return;
          report.syntheticInputDurationMs = Math.round(pcm.length / 48);
          report.stage = 'streaming_synthetic_audio';
          let offset = 0;
          streamTimer = setInterval(() => {
            if (finished || closing || socket.readyState !== 1) return;
            const chunk = offset < pcm.length ? pcm.subarray(offset, offset + 4800) : Buffer.alloc(4800);
            offset += chunk.length;
            socket.send(JSON.stringify({ type: 'session.input_audio.append', audio: chunk.toString('base64') }));
            if (offset >= pcm.length) timing.endInput(performance.now());
          }, 100);
        } catch { report.stage = 'synthetic_input_network'; close(); }
      }
      if (event.type === 'session.input_transcript.delta') report.inputTranscript += event.delta || '';
      if (event.type === 'session.output_transcript.delta') report.outputTranscript += event.delta || '';
      if (event.type === 'session.output_audio.delta') {
        timing.audio(performance.now());
        report.outputAudioBytes += Buffer.from(event.delta || '', 'base64').length;
        if (report.stage !== 'receiving_audio') { report.stage = 'receiving_audio'; setTimeout(close, 4500); }
      }
      if (event.type === 'session.closed') {
        report.finalizedUsageReceived = true;
        report.usage = event.usage || null;
        report.stage = 'finalized';
        finish(report.outputAudioBytes ? 'audio_received' : 'no_audio');
      }
    });
  });
}
await writeFile(new URL('provider-smoke-results.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
