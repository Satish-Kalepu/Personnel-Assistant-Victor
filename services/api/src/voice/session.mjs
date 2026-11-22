import { randomUUID } from "node:crypto";

export class VoiceSession {
  constructor({ provider, api, send, close, now = Date.now }) {
    Object.assign(this, { provider, api, send, closeClient: close, now });
    this.generation = 0;
    this.closed = false;
    this.started = false;
    this.muted = false;
    this.audioBytes = 0;
    this.stt = null;
    this.tts = null;
    this.pendingInput = [];
    this.seenUtterances = new Set();
    this.speechActive = false;
    this.awaitingTranscripts = 0;
    this.processingInput = false;
    this.retryInput = null;
    this.inputPaused = false;
  }
  async start(mode, conversationId, inputMode = "live") {
    if (!["personal", "practice"].includes(mode))
      throw new Error("Choose a conversation mode.");
    this.mode = mode;
    if (!["live", "push-to-talk"].includes(inputMode)) throw new Error("Invalid voice input mode.");
    this.inputMode = inputMode;
    this.inputFinished = inputMode === "live";
    this.conversationId = conversationId || randomUUID();
    const { maxSeconds } = await this.api("/voice/session", { mode });
    if (this.closed) return;
    this.deadline = this.now() + Math.min(maxSeconds, 300) * 1000;
    const listen = inputMode === "push-to-talk" ? this.provider.listenManual : this.provider.listen;
    if (!listen) throw new Error("Press and speak is unavailable.");
    this.stt = await listen.call(this.provider,
      (event) => this.event(event),
      () => this.fail("Speech recognition disconnected. Start voice again."),
    );
    if (this.closed) {
      this.stt.close();
      return;
    }
    this.started = true;
    this.audioStart = this.now();
    this.send({
      type: "ready",
      sampleRate: 16000,
      outputSampleRate: 24000,
      maxSeconds: Math.min(maxSeconds, 300),
    });
    this.send({ type: "state", state: "listening" });
  }
  audio(bytes) {
    if (!this.started || this.closed || (this.inputMode === "push-to-talk" && this.inputFinished) || bytes.length > 3200 || bytes.length % 2)
      throw new Error("Invalid microphone frame.");
    this.audioBytes += bytes.length;
    // Enforce wall-clock duration and real-time pacing on the trusted gateway.
    if (
      this.now() >= this.deadline ||
      this.audioBytes > 32000 * ((this.now() - this.audioStart) / 1000 + 1)
    )
      throw new Error("Voice session limit reached.");
    this.stt.send(bytes);
  }
  finishInput() {
    if (this.closed || !this.started || this.inputMode !== "push-to-talk" || this.inputFinished)
      throw new Error("Invalid input finish.");
    this.inputFinished = true;
    this.send({type:"state",state:"thinking"});
    this.stt.finish();
  }
  event(event) {
    if (this.closed) return;
    if (event.event === "transcript.final" && event.utteranceId !== undefined && this.seenUtterances.has(event.utteranceId)) return;
    if (Number.isInteger(event.pendingTranscripts))
      this.awaitingTranscripts = event.pendingTranscripts;
    if (typeof event.speechActive === "boolean")
      this.speechActive = event.speechActive;
    if (event.owner === "backend" && ["vad.speech_start", "vad.speech_end"].includes(event.event))
      this.send({type:"speechBoundary", state:event.event === "vad.speech_start" ? "started" : "ended", silenceMs:event.silence_ms, semanticCompletion:false});
    if (event.event === "vad.speech_start") {
      this.speechActive = true;
      this.interrupt();
    }
    if (event.event === "vad.speech_end") {
      this.speechActive = false;
      this.drainInput();
    }
    if (event.event === "transcript.partial")
      this.send({ type: "transcript", text: event.text || "", final: false });
    if (event.event === "transcript.final" && event.text?.trim()) {
      this.manualHasSpeech = true;
      if (event.utteranceId !== undefined) {
        if (this.seenUtterances.has(event.utteranceId)) return;
        this.seenUtterances.add(event.utteranceId);
      } else this.speechActive = false;
      const text = event.text.trim();
      if (this.pendingInput.length >= 128 || this.pendingInput.reduce((n,part)=>n+part.length,0)+text.length > 16000) {
        this.fail("Too much speech is waiting to be processed. The latest statements are not confirmed as saved. Please use shorter turns or text chat.");
        return;
      }
      this.pendingInput.push(text);
      this.inputPaused = false;
      this.send({ type: "transcript", text, final: true });
      this.drainInput();
    }
    if (event.event === "transcript.final" && !event.text?.trim()) {
      if (this.inputMode === "push-to-talk" && this.inputFinished && !this.manualHasSpeech)
        this.send({type:"inputComplete",empty:true});
      this.drainInput();
    }
    if (event.event === "error" && event.is_fatal)
      this.fail(
        "Speech service unavailable. Check the provider account or try later.",
      );
  }
  interrupt() {
    this.generation++;
    // Reply cancellation must not erase user input/facts already processing.
    // Session stop/logout still abort the model request below.
    this.tts?.close();
    this.tts = null;
    clearTimeout(this.speechTimer);
    this.send({ type: "clear", turn: this.generation });
    this.send({ type: "state", state: "listening" });
  }
  drainInput() {
    if (this.closed || this.processingInput || this.inputPaused || this.speechActive || this.awaitingTranscripts > 0 || (this.inputMode === "push-to-talk" && !this.inputFinished)) return;
    const batch = this.retryInput || this.takeInput();
    if (!batch) return;
    this.processingInput = true;
    this.respond(batch.text, batch.id).then((result) => {
      if (result.committed) this.retryInput = null;
      else if (!this.closed) {
        // Retry this exact id/content before newer input, including an
        // ambiguous backend failure after commit, without duplicate facts.
        this.retryInput = batch;
        this.inputPaused = true;
        this.send({type:"error",message:"Earlier statements are still waiting to be processed. Continue speaking to retry, or use text chat."});
      }
    }).catch(() => {
      if (!this.closed) {
        this.retryInput = batch;
        this.inputPaused = true;
        this.send({type:"error",message:"Your statements are still waiting to be processed. Continue speaking to retry, or use text chat."});
      }
    }).finally(() => {
      this.processingInput = false;
      this.drainInput();
    });
  }
  takeInput() {
    if (!this.pendingInput.length) return null;
    const parts = [this.pendingInput.shift()];
    let size = parts[0].length;
    while (this.pendingInput.length && size + 1 + this.pendingInput[0].length <= 4000) {
      const next = this.pendingInput.shift();
      parts.push(next);size += 1 + next.length;
    }
    return {id:randomUUID(), text:parts.join("\n")};
  }
  setMuted(value) {
    this.muted = value;
    if (value) {
      this.tts?.close();
      this.tts = null;
      clearTimeout(this.speechTimer);
      this.send({ type: "clear", turn: this.generation });
    }
  }
  async respond(message, clientMessageId) {
    let committed = false;
    this.interrupt();
    const turn = this.generation;
    const abort = new AbortController();
    this.abort = abort;
    this.send({ type: "state", state: "thinking" });
    const onAudio = (pcm) => {
      if (!this.closed && turn === this.generation && !this.muted)
        this.send({
          type: "audio",
          turn,
          sampleRate: 24000,
          audio: pcm.toString("base64"),
        });
    };
    const onEnd = () => {
      if (turn === this.generation) {
        clearTimeout(this.speechTimer);
        this.send({ type: "speechEnd", turn });
      }
    };
    const onError = () => {
      if (turn === this.generation && !this.closed)
        this.fail("Speech playback failed. Text chat is available.");
    };
    // Pay no synthesis character charge until an owned reply is checked. Start
    // the socket handshake while Bedrock is thinking to remove a serial RTT.
    const warming =
      !this.muted && this.provider.prepareSpeech
        ? this.provider
            .prepareSpeech(onAudio, onEnd, onError)
            .then((stream) => {
              if (this.closed || turn !== this.generation || this.muted) {
                stream.close();
                return null;
              }
              this.tts = stream;
              return stream;
            })
            .catch(() => null)
        : null;
    try {
      const response = await this.api(
        "/chat",
        {
          mode: this.mode,
          message,
          conversationId: this.conversationId,
          voice: true,
          ...(clientMessageId ? {clientMessageId} : {}),
        },
        abort.signal,
      );
      committed = true;
      if (this.closed || turn !== this.generation || this.pendingInput.length || this.speechActive || this.awaitingTranscripts > 0) return {committed};
      this.send({ type: "reply", ...response });
      if (this.muted) {
        this.send({ type: "state", state: "listening" });
        return {committed};
      }
      const checked = await this.api(
        "/voice/speech",
        {
          mode: this.mode,
          messageId: response.reply.id,
          createdAt: response.reply.createdAt,
        },
        abort.signal,
      );
      if (this.closed || turn !== this.generation) return {committed};
      this.speechTimer = setTimeout(
        () => this.fail("Speech playback timed out."),
        60000,
      );
      this.send({ type: "state", state: "speaking" });
      let tts;
      if (warming) {
        tts = await warming;
        if (this.closed || turn !== this.generation || this.muted) {
          tts?.close();
          return {committed};
        }
        if (!tts) throw new Error("Speech connection failed");
        if (tts.closed)
          tts = await this.provider.speak(
            checked.text,
            onAudio,
            onEnd,
            onError,
          );
        else tts.write(checked.text);
      } else
        tts = await this.provider.speak(checked.text, onAudio, onEnd, onError);
      if (this.closed || turn !== this.generation) tts.close();
      else this.tts = tts;
      return {committed};
    } catch (error) {
      if (
        this.closed ||
        turn !== this.generation ||
        error.name === "AbortError"
      )
        return {committed};
      if ([401, 429].includes(error.status)) {
        this.fail(
          error.publicMessage ||
            "Voice session paused. Sign in or check the processing allowance.",
        );
        return {committed};
      }
      this.interrupt();
      this.send({
        type: "error",
        message:
          error.publicMessage ||
          "Voice request failed. You can continue in text chat.",
      });
      this.send({ type: "state", state: "listening" });
      return {committed};
    }
  }
  fail(message) {
    if (!this.closed) {
      this.send({ type: "error", message });
      this.stop();
      this.closeClient();
    }
  }
  stop() {
    if (this.closed) return;
    this.closed = true;
    this.generation++;
    clearTimeout(this.speechTimer);
    this.abort?.abort();
    this.pendingInput.length = 0;
    this.seenUtterances.clear();
    this.retryInput = null;
    this.stt?.close();
    this.tts?.close();
  }
}
