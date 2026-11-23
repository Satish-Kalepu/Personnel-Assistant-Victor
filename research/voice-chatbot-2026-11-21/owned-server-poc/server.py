import asyncio
from collections import deque
import contextlib
import json
import secrets
import time
from pathlib import Path
import numpy as np
from aiohttp import web, ClientSession, ClientTimeout
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration
from aiortc.mediastreams import MediaStreamError
from av import AudioResampler
from vad import Silero, Endpoint, FRAME_SAMPLES
from media import Playback
from providers import configuration, cloud_ready, Recognizer, reply_clauses, synthesize, synthetic_fixture

BASE = Path(__file__).resolve().parent
PORT = 4319

class VoiceSession:
    def __init__(self, app, owner, mode, silence_ms):
        self.app, self.owner, self.mode = app, owner, mode
        self.id = secrets.token_urlsafe(18)
        self.pc = RTCPeerConnection(RTCConfiguration(iceServers=[]))
        self.playback = Playback()
        self.pc.addTrack(self.playback)
        self.vad, self.endpoint = Silero(), Endpoint(silence_ms=silence_ms)
        self.channel = None
        self.closed = False
        self.generation, self.turn = 0, 0
        self.task = None
        self.audio_task = None
        self.recognizer = None
        self.history = []
        self.pre_roll = deque(maxlen=9)
        self.events = deque(maxlen=160)
        self.frames = 0
        self.ended = {}
        self.timer = asyncio.get_running_loop().call_later(180, lambda: asyncio.create_task(self.close()))

        @self.pc.on('datachannel')
        def datachannel(channel):
            self.channel = channel
            @channel.on('open')
            def opened():
                self.emit({'type': 'ready', 'mode': self.mode, 'detector': 'Silero ONNX on our backend', 'endpoint': 'silence_based'})
            @channel.on('message')
            def message(data):
                try:
                    event = json.loads(data)
                except (ValueError, TypeError):
                    return
                if event.get('type') == 'stop_reply':
                    self.interrupt('stop_button')
            if channel.readyState == 'open':
                opened()

        @self.pc.on('track')
        def track(track):
            if track.kind == 'audio':
                self.audio_task = asyncio.create_task(self.consume(track))

        @self.pc.on('connectionstatechange')
        async def connection():
            if self.pc.connectionState in ('failed', 'closed') and not self.closed:
                await self.close()

    def emit(self, event):
        if self.closed:
            return
        event = {**event, 'server_ms': round(time.monotonic() * 1000), 'turn': event.get('turn', self.turn)}
        self.events.append(event)
        if self.channel and self.channel.readyState == 'open':
            self.channel.send(json.dumps(event))

    def interrupt(self, reason):
        self.generation += 1
        self.playback.clear()
        if self.task and not self.task.done():
            self.task.cancel()
        self.emit({'type': 'clear', 'reason': reason})

    async def prepare(self):
        if self.mode == 'cloud':
            config = self.app['config']
            self.recognizer = Recognizer(self.app['http'], config['SARVAM_API_KEY'], self.emit, self.on_transcript)
            await self.recognizer.open()

    async def consume(self, track):
        resampler = AudioResampler(format='s16', layout='mono', rate=16000)
        pending = b''
        try:
            while not self.closed:
                frame = await track.recv()
                for audio in resampler.resample(frame):
                    pending += audio.to_ndarray().astype('<i2', copy=False).tobytes()
                    while len(pending) >= FRAME_SAMPLES * 2:
                        chunk, pending = pending[:1024], pending[1024:]
                        probability = self.vad.probability(chunk)
                        self.frames += 1
                        self.pre_roll.append(chunk)
                        was_active = self.endpoint.active
                        events = self.endpoint.step(probability)
                        starts = any(event['type'] == 'speech_start' for event in events)
                        if starts:
                            self.turn += 1
                            self.interrupt('backend_speech_start')
                            if self.recognizer:
                                await self.recognizer.begin()
                                await self.recognizer.audio(b''.join(self.pre_roll))
                        elif was_active and self.recognizer:
                            await self.recognizer.audio(chunk)
                        for event in events:
                            self.emit(event)
                            if event['type'] == 'turn_end':
                                self.ended[self.turn] = time.monotonic()
                                if self.recognizer:
                                    await self.recognizer.end(self.turn, self.generation)
                                else:
                                    self.task = asyncio.create_task(self.local_agent(self.turn, self.generation))
                        if self.frames % 6 == 0:
                            self.emit({'type': 'vad', 'probability': round(probability, 3), 'frames': self.frames, 'active': self.endpoint.active})
        except (MediaStreamError, asyncio.CancelledError):
            pass
        except Exception as error:
            self.emit({'type': 'error', 'message': 'Audio processing stopped: ' + type(error).__name__})

    async def local_agent(self, turn, generation):
        self.emit({'type': 'agent_started', 'turn': turn, 'agent': 'local_fixture'})
        await asyncio.sleep(0.08)
        if generation != self.generation or self.closed:
            return
        self.emit({'type': 'reply', 'turn': turn, 'text': f'Local demo agent received turn {turn}. Backend speech detection and routing worked. This acknowledgement is a tone, not cloud TTS.'})
        t = np.arange(4800) / 24000
        tone = (0.08 * np.sin(2 * np.pi * 660 * t) * np.sin(np.linspace(0, np.pi, len(t)))).astype(np.float32)
        await self.playback.put_pcm((tone * 32767).astype('<i2').tobytes())
        self.emit({'type': 'agent_completed', 'turn': turn, 'agent': 'local_fixture'})

    def on_transcript(self, text, turn, generation):
        self.emit({'type': 'transcript_final', 'text': text, 'turn': turn, 'superseded': generation != self.generation})
        if text and generation == self.generation and not self.closed:
            self.task = asyncio.create_task(self.respond(text, turn, generation))

    async def respond(self, text, turn, generation):
        self.emit({'type': 'agent_started', 'turn': turn, 'agent': 'openai'})
        config = self.app['config']
        reply = []
        first = True
        def delta(event):
            if generation == self.generation:
                reply.append(event.get('text', ''))
                self.emit({**event, 'turn': turn})
        async def audio(pcm):
            nonlocal first
            if generation != self.generation or self.closed:
                return
            if first:
                first = False
                self.emit({'type': 'first_reply_pcm', 'turn': turn, 'endpoint_to_pcm_ms': round((time.monotonic() - self.ended[turn]) * 1000), 'measurement': 'server endpoint to first received PCM; not acoustic latency'})
            await self.playback.put_pcm(pcm)
        try:
            clauses = reply_clauses(self.app['http'], config['OPENAI_API_KEY'], text, self.history, delta)
            await synthesize(self.app['http'], config, clauses, audio)
            if generation == self.generation and not self.closed:
                answer = ''.join(reply)
                self.history.extend([{'role': 'user', 'content': text}, {'role': 'assistant', 'content': answer}])
                self.history = self.history[-6:]
                self.emit({'type': 'agent_completed', 'turn': turn, 'reply': answer})
        except asyncio.CancelledError:
            raise
        except Exception as error:
            self.emit({'type': 'error', 'turn': turn, 'message': 'Cloud agent pipeline failed: ' + type(error).__name__})

    async def close(self):
        if self.closed:
            return
        self.interrupt('session_closed')
        self.closed = True
        self.timer.cancel()
        current = asyncio.current_task()
        tasks = [task for task in (self.audio_task, self.task) if task and task is not current]
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        if self.recognizer:
            await self.recognizer.close()
        self.playback.stop()
        await self.pc.close()
        self.history.clear()
        self.pre_roll.clear()
        self.app['sessions'].pop(self.id, None)

def make_app(config=None):
    @web.middleware
    async def boundary(request, handler):
        allowed_hosts = {f'127.0.0.1:{PORT}', f'localhost:{PORT}'}
        if request.host not in allowed_hosts:
            raise web.HTTPForbidden(text='Local loopback host required.')
        if request.method == 'POST':
            if request.headers.get('Origin') not in {f'http://{host}' for host in allowed_hosts} or request.headers.get('X-Voice-POC') != 'local':
                raise web.HTTPForbidden(text='Same-origin local request required.')
        owner = request.cookies.get('voice_poc') or secrets.token_urlsafe(24)
        request['owner'] = owner
        response = await handler(request)
        response.set_cookie('voice_poc', owner, httponly=True, samesite='Strict')
        response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self'; media-src 'self' blob:; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'"
        return response
    app = web.Application(middlewares=[boundary], client_max_size=65536)
    app['config'] = config if config is not None else configuration()
    app['sessions'] = {}
    async def startup(app):
        app['http'] = ClientSession(timeout=ClientTimeout(total=40))
        # Fail explicitly before any microphone can start if model setup is missing.
        Silero()
    async def cleanup(app):
        await asyncio.gather(*(session.close() for session in list(app['sessions'].values())), return_exceptions=True)
        await app['http'].close()
    async def config_view(request):
        return web.json_response({'transport': 'real local WebRTC / aiortc', 'vad': 'Silero ONNX CPU', 'endpoint': 'silence_based', 'cloud_available': cloud_ready(app['config']), 'fixture_available': bool(app['config'].get('OPENAI_API_KEY')), 'max_seconds': 180, 'model': 'gpt-6-luna', 'no_production_data': True})
    async def offer(request):
        if app['sessions']:
            return web.json_response({'error': 'One local POC session at a time. End the active session first.'}, status=409)
        body = await request.json()
        if body.get('mode') not in ('local', 'cloud') or not isinstance(body.get('sdp'), str) or not body['sdp'].startswith('v=0'):
            return web.json_response({'error': 'Valid mode and WebRTC SDP offer required.'}, status=400)
        if body['mode'] == 'cloud' and not cloud_ready(app['config']):
            return web.json_response({'error': 'Existing OpenAI/Sarvam configuration and Sarvam privacy confirmation are required for cloud mode.'}, status=503)
        silence = int(body.get('silence_ms', 640))
        if silence not in (320, 640, 960):
            return web.json_response({'error': 'Choose a supported endpoint preset.'}, status=400)
        session = VoiceSession(app, request['owner'], body['mode'], silence)
        app['sessions'][session.id] = session
        try:
            await session.prepare()
            await session.pc.setRemoteDescription(RTCSessionDescription(sdp=body['sdp'], type='offer'))
            await session.pc.setLocalDescription(await session.pc.createAnswer())
            return web.json_response({'id': session.id, 'sdp': session.pc.localDescription.sdp, 'type': 'answer'})
        except Exception as error:
            await session.close()
            return web.json_response({'error': 'POC session setup failed: ' + type(error).__name__}, status=502)
    async def stop(request):
        body = await request.json()
        session = app['sessions'].get(body.get('id'))
        if session and session.owner != request['owner']:
            raise web.HTTPForbidden()
        if session:
            await session.close()
        return web.json_response({'closed': True})
    async def fixture(request):
        if not app['config'].get('OPENAI_API_KEY'):
            return web.json_response({'error': 'A configured OpenAI key is needed to generate the synthetic fixture.'}, status=503)
        try:
            audio = await synthetic_fixture(app['http'], app['config'])
            return web.Response(body=audio, content_type='application/octet-stream')
        except Exception:
            return web.json_response({'error': 'Synthetic fixture generation unavailable.'}, status=502)
    async def asset(request):
        name = request.match_info.get('name', 'index.html')
        if name not in ('index.html', 'app.js', 'style.css'):
            raise web.HTTPNotFound()
        return web.FileResponse(BASE / 'public' / name)
    app.router.add_get('/api/config', config_view)
    app.router.add_post('/api/offer', offer)
    app.router.add_post('/api/stop', stop)
    app.router.add_post('/api/fixture', fixture)
    app.router.add_get('/', asset)
    app.router.add_get('/{name}', asset)
    app.on_startup.append(startup)
    app.on_cleanup.append(cleanup)
    return app

if __name__ == '__main__':
    web.run_app(make_app(), host='127.0.0.1', port=PORT, access_log=None, print=lambda message: print('Owned voice POC: http://127.0.0.1:4319'))
