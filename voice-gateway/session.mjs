import { randomUUID } from "node:crypto";

export class VoiceSession {
  constructor({ provider, api, send, close, now = Date.now }) {
    Object.assign(this, { provider, api, send, closeClient: close, now });
    this.generation = 0; this.closed = false; this.started = false;
    this.muted = false; this.audioBytes = 0; this.stt = null; this.tts = null;
  }
  async start(mode, conversationId) {
    if (!["personal", "practice"].includes(mode)) throw new Error("Choose a conversation mode.");
    this.mode = mode; this.conversationId = conversationId || randomUUID();
    const { maxSeconds } = await this.api("/voice/session", { mode });
    if (this.closed) return;
    this.deadline = this.now() + Math.min(maxSeconds, 300) * 1000;
    this.stt = await this.provider.listen(event => this.event(event), () => this.fail("Speech recognition disconnected. Start voice again."));
    if (this.closed) { this.stt.close(); return; }
    this.started = true; this.audioStart = this.now();
    this.send({ type: "ready", sampleRate: 16000, outputSampleRate: 24000, maxSeconds: Math.min(maxSeconds, 300) });
    this.send({ type: "state", state: "listening" });
  }
  audio(bytes) {
    if (!this.started || this.closed || bytes.length > 3200 || bytes.length % 2) throw new Error("Invalid microphone frame.");
    this.audioBytes += bytes.length;
    // Enforce wall-clock duration and real-time pacing on the trusted gateway.
    if (this.now() >= this.deadline || this.audioBytes > 32000 * ((this.now() - this.audioStart) / 1000 + 1)) throw new Error("Voice session limit reached.");
    this.stt.send(bytes);
  }
  event(event) {
    if (this.closed) return;
    if (event.event === "vad.speech_start") this.interrupt();
    if (event.event === "transcript.partial") this.send({ type: "transcript", text: event.text || "", final: false });
    if (event.event === "transcript.final" && event.text?.trim()) {
      this.send({ type: "transcript", text: event.text, final: true });
      this.respond(event.text.trim()).catch(() => this.fail("Voice reply failed. Text chat is still available."));
    }
    if (event.event === "error" && event.is_fatal) this.fail("Speech service unavailable. Check the provider account or try later.");
  }
  interrupt() {
    this.generation++;
    this.abort?.abort(); this.tts?.close(); this.tts = null;
    clearTimeout(this.speechTimer);
    this.send({ type: "clear", turn: this.generation });
    this.send({ type: "state", state: "listening" });
  }
  setMuted(value) {
    this.muted = value;
    if (value) {
      this.tts?.close(); this.tts = null; clearTimeout(this.speechTimer);
      this.send({ type: "clear", turn: this.generation });
    }
  }
  async respond(message) {
    this.interrupt();
    const turn = this.generation;
    const abort = new AbortController(); this.abort = abort;
    this.send({ type: "state", state: "thinking" });
    const onAudio = pcm => { if (!this.closed && turn === this.generation && !this.muted) this.send({ type: "audio", turn, sampleRate: 24000, audio: pcm.toString("base64") }); };
    const onEnd = () => { if (turn === this.generation) { clearTimeout(this.speechTimer); this.send({ type: "speechEnd", turn }); } };
    const onError = () => { if (turn === this.generation && !this.closed) this.fail("Speech playback failed. Text chat is available."); };
    // Pay no synthesis character charge until an owned reply is checked. Start
    // the socket handshake while Bedrock is thinking to remove a serial RTT.
    const warming = !this.muted && this.provider.prepareSpeech
      ? this.provider.prepareSpeech(onAudio, onEnd, onError).then(stream => {
        if (this.closed || turn !== this.generation || this.muted) { stream.close(); return null; }
        this.tts = stream; return stream;
      }).catch(() => null) : null;
    try {
      const response = await this.api("/chat", { mode: this.mode, message, conversationId: this.conversationId, voice: true }, abort.signal);
      if (this.closed || turn !== this.generation) return;
      this.send({ type: "reply", ...response });
      if (this.muted) { this.send({ type: "state", state: "listening" }); return; }
      const checked = await this.api("/voice/speech", {
        mode: this.mode, messageId: response.reply.id, createdAt: response.reply.createdAt,
      }, abort.signal);
      if (this.closed || turn !== this.generation) return;
      this.speechTimer = setTimeout(() => this.fail("Speech playback timed out."), 60000);
      this.send({ type: "state", state: "speaking" });
      let tts;
      if (warming) {
        tts = await warming;
        if (this.closed || turn !== this.generation || this.muted) { tts?.close(); return; }
        if (!tts) throw new Error("Speech connection failed");
        if (tts.closed) tts = await this.provider.speak(checked.text, onAudio, onEnd, onError);
        else tts.write(checked.text);
      } else tts = await this.provider.speak(checked.text, onAudio, onEnd, onError);
      if (this.closed || turn !== this.generation) tts.close(); else this.tts = tts;
    } catch (error) {
      if (this.closed || turn !== this.generation || error.name === "AbortError") return;
      if ([401, 429].includes(error.status)) { this.fail(error.publicMessage || "Voice session paused. Sign in or check the processing allowance."); return; }
      this.interrupt();
      this.send({ type: "error", message: error.publicMessage || "Voice request failed. You can continue in text chat." });
      this.send({ type: "state", state: "listening" });
    }
  }
  fail(message) { if (!this.closed) { this.send({ type: "error", message }); this.stop(); this.closeClient(); } }
  stop() {
    if (this.closed) return;
    this.closed = true; this.generation++;
    clearTimeout(this.speechTimer);
    this.abort?.abort(); this.stt?.close(); this.tts?.close();
  }
}
