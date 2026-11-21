"""Local CPU Silero activity detection and explicitly silence-based endpointing."""
import hashlib
import json
from pathlib import Path
import numpy as np
import onnxruntime as ort

SAMPLE_RATE = 16000
FRAME_SAMPLES = 512
FRAME_MS = 32

class Silero:
    def __init__(self, path=None):
        base = Path(__file__).resolve().parent
        path = Path(path or base / '.local' / 'silero_vad.onnx')
        manifest = json.loads((base / 'model-manifest.json').read_text(encoding='utf-8'))
        if hashlib.sha256(path.read_bytes()).hexdigest() != manifest['sha256']:
            raise ValueError('Local VAD model hash does not match its manifest.')
        options = ort.SessionOptions()
        options.inter_op_num_threads = 1
        options.intra_op_num_threads = 1
        self.session = ort.InferenceSession(str(path), sess_options=options, providers=['CPUExecutionProvider'])
        self.reset()

    def reset(self):
        self.state = np.zeros((2, 1, 128), dtype=np.float32)
        self.context = np.zeros((1, 64), dtype=np.float32)

    def probability(self, pcm):
        if len(pcm) != FRAME_SAMPLES * 2:
            raise ValueError('VAD requires exactly 512 mono PCM16 samples.')
        audio = np.frombuffer(pcm, dtype='<i2').astype(np.float32).reshape(1, -1) / 32768.0
        joined = np.concatenate((self.context, audio), axis=1)
        probability, self.state = self.session.run(None, {'input': joined, 'state': self.state, 'sr': np.array(SAMPLE_RATE, dtype=np.int64)})
        self.context = joined[:, -64:].copy()
        return float(probability[0, 0])

class Endpoint:
    """Hysteresis and hangover; never claims semantic thought completion."""
    def __init__(self, silence_ms=640, threshold=0.60, start_frames=3):
        self.silence_ms = silence_ms
        self.threshold = threshold
        self.start_frames = start_frames
        self.reset()

    def reset(self):
        self.samples = 0
        self.active = False
        self.candidate_frames = 0
        self.last_voice_sample = 0
        self.start_sample = 0

    def step(self, probability):
        now = self.samples
        self.samples += FRAME_SAMPLES
        events = []
        if not self.active:
            self.candidate_frames = self.candidate_frames + 1 if probability >= self.threshold else 0
            if self.candidate_frames >= self.start_frames:
                self.active = True
                self.start_sample = max(0, now - (self.start_frames - 1) * FRAME_SAMPLES)
                self.last_voice_sample = self.samples
                events.append({'type': 'speech_start', 'audio_ms': self.start_sample / 16})
        else:
            if probability >= self.threshold - 0.15:
                self.last_voice_sample = self.samples
            silence = (self.samples - self.last_voice_sample) / 16
            if silence >= self.silence_ms:
                events.append({'type': 'speech_end', 'audio_ms': self.last_voice_sample / 16, 'detected_at_audio_ms': self.samples / 16, 'silence_ms': silence})
                events.append({'type': 'turn_end', 'audio_ms': self.samples / 16, 'method': 'silence_based', 'semantic_completion': False})
                self.active = False
                self.candidate_frames = 0
        return events
