"""Private PCM/VAD service. App API owns authentication, agent state and providers."""
import asyncio
from collections import deque
import hmac
import os
from pathlib import Path
import time
from aiohttp import web, WSMsgType
from vad import Silero, Endpoint

BASE=Path(__file__).resolve().parent
MODEL=BASE/'.models'/'silero_vad.onnx'

class Detector:
    def __init__(self, detector=None, silence_ms=640):
        self.vad=detector or Silero(MODEL)
        self.endpoint=Endpoint(silence_ms=silence_ms)
        self.pending=b''
        self.pre_roll=deque(maxlen=9)
        self.turn=0
        self.frames=0

    def push(self, data):
        if not data or len(data)>3200 or len(data)%2:
            raise ValueError('Invalid PCM16 frame')
        self.pending+=data
        output=[]
        while len(self.pending)>=1024:
            chunk,self.pending=self.pending[:1024],self.pending[1024:]
            self.pre_roll.append(chunk)
            active=self.endpoint.active
            events=self.endpoint.step(self.vad.probability(chunk))
            starts=any(e['type']=='speech_start' for e in events)
            self.frames+=1
            if starts:
                self.turn+=1
                output.append({'event':'vad.speech_start','turn':self.turn,'owner':'backend'})
                output.append(b''.join(self.pre_roll))
            elif active:
                output.append(chunk)
            for event in events:
                if event['type']=='speech_end':
                    output.append({'event':'vad.speech_end','turn':self.turn,'silence_ms':event['silence_ms'],'owner':'backend','semantic_completion':False})
        return output

def make_app(token=None):
    token=token or os.environ.get('VOICE_GATEWAY_TOKEN','')
    if len(token)<32:raise ValueError('Private worker token must contain at least 32 characters')
    Silero(MODEL)  # Validate pinned artifact before reporting healthy.
    app=web.Application(client_max_size=4096)
    app['peers']=set()
    async def health(request):
        return web.json_response({'status':'ready','detector':'silero','endpoint':'silence_based'})
    async def listen(request):
        if not hmac.compare_digest(request.headers.get('Authorization',''),'Bearer '+token):
            raise web.HTTPUnauthorized()
        if len(app['peers'])>=20:raise web.HTTPServiceUnavailable()
        detector=Detector()
        # aiohttp rejects payloads equal to its transport limit. Application
        # validation in Detector still accepts at most3200 PCM bytes.
        ws=web.WebSocketResponse(max_msg_size=4096,heartbeat=15,compress=False)
        app['peers'].add(ws)
        try:
            await ws.prepare(request)
            started=time.monotonic();received=0
            async with asyncio.timeout(310):
                async for message in ws:
                    if message.type==WSMsgType.BINARY:
                        received+=len(message.data)
                        if received>32000*(time.monotonic()-started+1):
                            await ws.close(code=1008,message=b'Audio pacing limit');break
                        for event in detector.push(message.data):
                            if isinstance(event,bytes):await ws.send_bytes(event)
                            else:await ws.send_json(event)
                    elif message.type in (WSMsgType.ERROR,WSMsgType.CLOSE):break
                    else:
                        await ws.close(code=1008,message=b'PCM only');break
        except (TimeoutError,ValueError):
            await ws.close(code=1008,message=b'Voice worker session ended')
        finally:
            app['peers'].discard(ws)
        return ws
    async def shutdown(app):
        await asyncio.gather(*(ws.close(code=1001,message=b'Restarting') for ws in list(app['peers'])),return_exceptions=True)
    app.router.add_get('/health',health)
    app.router.add_get('/listen',listen)
    app.on_shutdown.append(shutdown)
    return app

if __name__=='__main__':
    web.run_app(make_app(),host=os.environ.get('VOICE_WORKER_BIND','127.0.0.1'),port=4320,access_log=None)
