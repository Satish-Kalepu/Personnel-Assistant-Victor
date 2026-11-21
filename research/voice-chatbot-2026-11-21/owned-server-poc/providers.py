"""Private cloud adapters for the isolated POC; never access production state."""
import asyncio
import base64
import json
import os
from pathlib import Path
from urllib.parse import urlencode
from collections import deque
import aiohttp

BASE = Path(__file__).resolve().parent

def configuration():
    allowed = ['OPENAI_API_KEY', 'SARVAM_API_KEY', 'SARVAM_PRIVACY_CONFIRMED', 'SARVAM_SPEAKER']
    values = {}
    path = BASE.parents[2] / '.env'
    if path.exists():
        for line in path.read_text(encoding='utf-8-sig').splitlines():
            name, separator, value = line.partition('=')
            name = name.strip()
            if separator and name in allowed:
                values[name] = value.strip().strip('"').strip("'")
    for name in allowed:
        if os.environ.get(name):
            values[name] = os.environ[name]
    return values

def cloud_ready(config):
    return bool(config.get('OPENAI_API_KEY') and config.get('SARVAM_API_KEY') and config.get('SARVAM_PRIVACY_CONFIRMED', '').lower() == 'true')

class Recognizer:
    def __init__(self, http, key, emit, final):
        self.http, self.key, self.emit, self.final = http, key, emit, final
        self.pending = deque()
        self.closed = False

    async def open(self):
        query = urlencode({'model': 'saaras:v4', 'language_code': 'en-IN', 'mode': 'transcribe', 'stream_type': 'fast', 'endpointing': 'manual', 'encoding': 'linear16', 'sample_rate': 16000})
        self.ws = await self.http.ws_connect('wss://api.sarvam.ai/speech-to-text-realtime/ws?' + query,
            headers={'Api-Subscription-Key': self.key}, heartbeat=20, max_msg_size=2_000_000)
        self.reader = asyncio.create_task(self.read())

    async def read(self):
        try:
            async for message in self.ws:
                if message.type != aiohttp.WSMsgType.TEXT:
                    continue
                event = json.loads(message.data)
                kind = event.get('event')
                if kind == 'transcript.partial':
                    self.emit({'type': 'transcript_partial', 'text': event.get('text', '')})
                elif kind == 'transcript.final':
                    text = event.get('text', '').strip()
                    if self.pending:
                        turn, generation = self.pending.popleft()
                        self.final(text, turn, generation)
                elif kind == 'error':
                    self.emit({'type': 'error', 'message': 'Streaming transcription returned an error; stop the session and inspect provider setup.'})
        except asyncio.CancelledError:
            raise
        except Exception:
            if not self.closed:
                self.emit({'type': 'error', 'message': 'Streaming transcription disconnected.'})

    async def begin(self):
        await self.ws.send_json({'event': 'speech_start'})

    async def audio(self, pcm):
        await self.ws.send_json({'event': 'audio_input', 'audio': base64.b64encode(pcm).decode()})

    async def end(self, turn, generation):
        self.pending.append((turn, generation))
        await self.ws.send_json({'event': 'speech_end'})

    async def close(self):
        self.closed = True
        if getattr(self, 'reader', None):
            self.reader.cancel()
            await asyncio.gather(self.reader, return_exceptions=True)
        if getattr(self, 'ws', None):
            await self.ws.close()

async def reply_clauses(http, key, text, history, emit):
    """Stream spoken clauses, with no complete reply/facts JSON gate."""
    body = {
        'model': 'gpt-6-luna', 'store': False, 'stream': True,
        'reasoning': {'effort': 'none'}, 'max_output_tokens': 160,
        'instructions': 'You are Victor in an isolated voice-server POC. Answer warmly in one or two short plain spoken sentences. Do not claim access to personal memory, accounts or real actions. For arithmetic, calculate the correct answer. User speech transcripts can contain mistakes; ask a short clarification when needed.',
        'input': [*history[-6:], {'role': 'user', 'content': text}],
    }
    complete, pending = '', ''
    async with http.post('https://api.openai.com/v1/responses', headers={'Authorization': 'Bearer ' + key}, json=body, timeout=aiohttp.ClientTimeout(total=30)) as response:
        if response.status != 200:
            raise RuntimeError('Reasoning provider rejected the request.')
        async for line in response.content:
            if not line.startswith(b'data: '):
                continue
            raw = line[6:].strip()
            if raw == b'[DONE]':
                break
            event = json.loads(raw)
            if event.get('type') == 'response.output_text.delta':
                delta = event.get('delta', '')
                complete += delta
                pending += delta
                emit({'type': 'reply_delta', 'text': delta})
                if (len(pending) >= 35 and pending.rstrip().endswith(('.', '?', '!', ';'))) or len(pending) >= 130:
                    yield pending
                    pending = ''
            elif event.get('type') in ('error', 'response.failed'):
                raise RuntimeError('Reasoning response failed.')
    if pending.strip():
        yield pending
    if not complete.strip():
        raise RuntimeError('Reasoning provider returned no spoken text.')

async def synthesize(http, config, clauses, on_pcm):
    """Overlap a streamed text producer with TTS setup and audio consumption."""
    queue = asyncio.Queue(maxsize=16)
    async def produce():
        try:
            async for clause in clauses:
                await queue.put(clause)
        except Exception as error:
            await queue.put(error)
        finally:
            await queue.put(None)
    producer = asyncio.create_task(produce())
    try:
        async with http.ws_connect('wss://api.sarvam.ai/text-to-speech/ws?model=bulbul:v4-flash&send_completion_event=true',
            headers={'Api-Subscription-Key': config['SARVAM_API_KEY']}, heartbeat=20, max_msg_size=4_000_000) as ws:
            await ws.send_json({'type': 'config', 'data': {'language_code': 'en-IN', 'speaker': config.get('SARVAM_SPEAKER') or 'simran_en_customer', 'speech_sample_rate': 24000, 'output_audio_codec': 'linear16', 'min_buffer_size': 30, 'max_chunk_length': 150, 'enable_preprocessing': True}})
            async def send():
                while True:
                    clause = await queue.get()
                    if clause is None:
                        await ws.send_json({'type': 'flush'})
                        return
                    if isinstance(clause, Exception):
                        raise clause
                    await ws.send_json({'type': 'text', 'data': {'text': clause}})
            sender = asyncio.create_task(send())
            try:
                async with asyncio.timeout(35):
                    async for message in ws:
                        if message.type != aiohttp.WSMsgType.TEXT:
                            continue
                        event = json.loads(message.data)
                        if event.get('type') == 'audio':
                            await on_pcm(base64.b64decode(event['data']['audio']))
                        elif event.get('type') == 'event' and event.get('data', {}).get('event_type') == 'final':
                            break
                        elif event.get('type') == 'error':
                            raise RuntimeError('Speech synthesis returned an error.')
                await sender
            finally:
                sender.cancel()
                await asyncio.gather(sender, return_exceptions=True)
    finally:
        producer.cancel()
        await asyncio.gather(producer, return_exceptions=True)

async def synthetic_fixture(http, config):
    """Cache only an explicitly synthetic test phrase; never human audio."""
    path = BASE / '.local' / 'fixture.pcm'
    if path.exists():
        return path.read_bytes()
    phrase = 'Hello Victor. What is twelve times thirteen?'
    async with http.post('https://api.openai.com/v1/audio/speech', headers={'Authorization': 'Bearer ' + config['OPENAI_API_KEY']},
        json={'model': 'gpt-4o-mini-tts', 'voice': 'alloy', 'input': phrase, 'response_format': 'pcm'},
        timeout=aiohttp.ClientTimeout(total=30)) as response:
        if response.status != 200:
            raise RuntimeError('Synthetic fixture generation failed.')
        data = await response.read()
    if not 4800 < len(data) < 1_000_000:
        raise RuntimeError('Synthetic fixture size out of bounds.')
    path.write_bytes(data)
    return data
