import asyncio
from pathlib import Path
import unittest
import numpy as np
from aiohttp import ClientSession, WSServerHandshakeError
from aiohttp.test_utils import TestServer
from worker import Detector,make_app

class DetectionTests(unittest.TestCase):
    def test_real_speech_endpoint_and_preroll(self):
        fixture=Path(__file__).resolve().parents[2]/'research/voice-chatbot-2026-11-21/owned-server-poc/.local/fixture.pcm'
        pcm=np.frombuffer(fixture.read_bytes(),dtype='<i2')
        audio=np.interp(np.arange(0,len(pcm),1.5),np.arange(len(pcm)),pcm).astype('<i2').tobytes()
        stream=bytes(16000)+audio+bytes(32000)
        detector=Detector();events=[];forwarded=0
        for position in range(0,len(stream),3200):
            for event in detector.push(stream[position:position+3200]):
                if isinstance(event,bytes):forwarded+=len(event)
                else:events.append(event)
        self.assertEqual([e['event'] for e in events],['vad.speech_start','vad.speech_end'])
        self.assertEqual(events[1]['silence_ms'],640)
        self.assertFalse(events[1]['semantic_completion'])
        self.assertGreater(forwarded,len(audio)*.7)

    def test_real_silence_not_forwarded(self):
        detector=Detector()
        for _ in range(20):self.assertEqual(detector.push(bytes(3200)),[])
        with self.assertRaises(ValueError):detector.push(bytes(3201))

class AccessTests(unittest.IsolatedAsyncioTestCase):
    async def test_private_token_required_and_connection_released(self):
        server=TestServer(make_app('synthetic-private-worker-token-123456'))
        await server.start_server()
        async with ClientSession() as client:
            try:
                with self.assertRaises(WSServerHandshakeError) as raised:
                    await client.ws_connect(server.make_url('/listen'))
                self.assertEqual(raised.exception.status,401)
                ws=await client.ws_connect(server.make_url('/listen'),headers={'Authorization':'Bearer synthetic-private-worker-token-123456'})
                await ws.send_bytes(bytes(3200))
                await ws.ping(b'full-frame-accepted')
                await asyncio.sleep(.08)
                self.assertFalse(ws.closed)
                self.assertEqual(len(server.app['peers']),1)
                await ws.send_str('invalid-control')
                await ws.receive()
                await ws.close()
                await asyncio.sleep(.01)
                self.assertEqual(len(server.app['peers']),0)
            finally:await server.close()

if __name__=='__main__':unittest.main(verbosity=2)
