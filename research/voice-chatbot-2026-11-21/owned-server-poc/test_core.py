import unittest
import asyncio
import numpy as np
from vad import Silero, Endpoint
from media import Playback
from server import VoiceSession

class EndpointTests(unittest.TestCase):
    def test_silence_never_starts_and_isolated_spike_is_rejected(self):
        endpoint=Endpoint()
        for probability in [0]*40+[.9]+[0]*40:
            self.assertEqual(endpoint.step(probability), [])
        self.assertFalse(endpoint.active)

    def test_pause_tolerance_hysteresis_and_one_endpoint(self):
        endpoint=Endpoint(silence_ms=640)
        starts=[]
        for _ in range(3): starts+=endpoint.step(.9)
        self.assertEqual([e['type'] for e in starts], ['speech_start'])
        for _ in range(10): self.assertEqual(endpoint.step(0), [])
        self.assertTrue(endpoint.active)
        endpoint.step(.5)  # Hysteresis counts this as continued speech.
        for _ in range(19): self.assertEqual(endpoint.step(0), [])
        ended=endpoint.step(0)
        self.assertEqual([e['type'] for e in ended], ['speech_end','turn_end'])
        self.assertEqual(ended[0]['silence_ms'], 640)
        self.assertFalse(ended[1]['semantic_completion'])
        for _ in range(40): self.assertEqual(endpoint.step(0), [])
        endpoint.reset()
        self.assertEqual(endpoint.samples,0)

    def test_presets_end_on_corresponding_audio_frame(self):
        for silence in (320,640,960):
            endpoint=Endpoint(silence_ms=silence)
            for _ in range(3): endpoint.step(.9)
            events=[]
            for _ in range(silence//32): events+=endpoint.step(0)
            self.assertEqual(len(events),2)
            self.assertEqual(events[0]['silence_ms'],silence)

    def test_real_onnx_rejects_digital_silence(self):
        detector=Silero()
        self.assertLess(max(detector.probability(bytes(1024)) for _ in range(30)),.1)
        with self.assertRaises(ValueError): detector.probability(bytes(100))

class PlaybackTests(unittest.IsolatedAsyncioTestCase):
    async def test_clear_discards_queued_and_partial_reply(self):
        playback=Playback()
        await playback.put_pcm(np.full(1200,2500,dtype='<i2').tobytes())
        self.assertGreater(np.max(np.abs((await playback.recv()).to_ndarray())),1000)
        playback.clear()
        self.assertEqual(np.max(np.abs((await playback.recv()).to_ndarray())),0)
        playback.stop()

class CancellationTests(unittest.IsolatedAsyncioTestCase):
    async def test_new_speech_cancels_agent_before_stale_reply(self):
        app={'sessions':{}}
        session=VoiceSession(app,'unit-owner','local',640)
        app['sessions'][session.id]=session
        try:
            session.task=asyncio.create_task(session.local_agent(1,session.generation))
            await asyncio.sleep(.01)
            session.interrupt('backend_speech_start')
            await asyncio.gather(session.task,return_exceptions=True)
            self.assertTrue(session.task.cancelled())
            self.assertNotIn('reply',[event['type'] for event in session.events])
            self.assertTrue(session.playback.queue.empty())
        finally:await session.close()
        self.assertEqual(app['sessions'],{})

    async def test_late_transcript_is_marked_superseded_without_agent_call(self):
        app={'sessions':{}}
        session=VoiceSession(app,'unit-owner','cloud',640)
        try:
            old=session.generation
            session.interrupt('backend_speech_start')
            session.on_transcript('Old utterance',1,old)
            self.assertTrue(session.events[-1]['superseded'])
            self.assertIsNone(session.task)
        finally:await session.close()

if __name__=='__main__': unittest.main(verbosity=2)
