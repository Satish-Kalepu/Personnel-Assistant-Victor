import asyncio
from fractions import Fraction
import numpy as np
from av import AudioFrame, AudioResampler
from aiortc import MediaStreamTrack

class Playback(MediaStreamTrack):
    kind = 'audio'
    def __init__(self):
        super().__init__()
        self.queue = asyncio.Queue(maxsize=100)
        self.pending = np.zeros(0, dtype=np.int16)
        self.pts = 0
        self.started = None
        self.generation = 0
        self.resampler = AudioResampler(format='s16', layout='mono', rate=48000)

    def clear(self):
        self.generation += 1
        self.pending = np.zeros(0, dtype=np.int16)
        while not self.queue.empty():
            self.queue.get_nowait()
        self.resampler = AudioResampler(format='s16', layout='mono', rate=48000)

    async def put_pcm(self, pcm, rate=24000):
        if len(pcm) % 2:
            raise ValueError('Odd PCM byte count.')
        generation = self.generation
        frame = AudioFrame.from_ndarray(np.frombuffer(pcm, dtype='<i2').reshape(1, -1), format='s16', layout='mono')
        frame.sample_rate = rate
        for converted in self.resampler.resample(frame):
            samples = converted.to_ndarray().reshape(-1).copy()
            for offset in range(0, len(samples), 960):
                if generation != self.generation:
                    return
                await self.queue.put((generation, samples[offset:offset + 960]))

    async def recv(self):
        loop = asyncio.get_running_loop()
        if self.started is None:
            self.started = loop.time()
        wait = self.started + self.pts / 48000 - loop.time()
        if wait > 0:
            await asyncio.sleep(wait)
        while len(self.pending) < 960 and not self.queue.empty():
            generation, chunk = self.queue.get_nowait()
            if generation == self.generation:
                self.pending = np.concatenate((self.pending, chunk))
        out = np.zeros(960, dtype=np.int16)
        count = min(960, len(self.pending))
        out[:count] = self.pending[:count]
        self.pending = self.pending[count:]
        frame = AudioFrame.from_ndarray(out.reshape(1, -1), format='s16', layout='mono')
        frame.sample_rate = 48000
        frame.pts = self.pts
        frame.time_base = Fraction(1, 48000)
        self.pts += 960
        return frame
