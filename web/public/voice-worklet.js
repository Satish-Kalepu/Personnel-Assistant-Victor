/* Downsample microphone samples to mono PCM16 at 16kHz in 100ms frames. */
class VictorMicrophone extends AudioWorkletProcessor {
  constructor() {
    super(); this.phase = 0; this.sum = 0; this.count = 0;
    this.frame = new Int16Array(1600); this.position = 0;
  }
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;
    for (const sample of channel) {
      this.sum += sample; this.count++; this.phase += 16000;
      if (this.phase >= sampleRate) {
        const value = Math.max(-1, Math.min(1, this.sum / this.count));
        this.frame[this.position++] = Math.round(value * (value < 0 ? 32768 : 32767));
        this.sum = 0; this.count = 0; this.phase -= sampleRate;
        if (this.position === this.frame.length) {
          const bytes = new ArrayBuffer(3200), view = new DataView(bytes);
          for (let i = 0; i < this.frame.length; i++) view.setInt16(i * 2, this.frame[i], true);
          this.port.postMessage(bytes, [bytes]); this.position = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("victor-microphone", VictorMicrophone);
