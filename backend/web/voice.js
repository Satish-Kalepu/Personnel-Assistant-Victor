"use strict";

window.VictorVoice = class {
  constructor({ api, token, onState, onTranscript, onReply, onError }) {
    Object.assign(this, { api, token, onState, onTranscript, onReply, onError });
    this.generation = 0; this.sources = new Set(); this.active = false;
  }
  async start(mode, conversationId, muted = false) {
    this.stop(); const generation = this.generation;
    const current = () => generation === this.generation;
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode) throw new Error("Voice needs a browser with microphone and AudioWorklet support.");
      this.active = true; this.onState("connecting");
      this.context = new AudioContext(); await this.context.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (!current()) { stream.getTracks().forEach(track => track.stop()); return; }
      this.stream = stream;
      const { gatewayUrl } = await this.api("/voice/config");
      if (!current()) return;
      if (!/^wss:\/\/[a-z0-9.-]+(?::[0-9]+)?\/voice$/.test(gatewayUrl)) throw new Error("Voice is not enabled yet. Text chat is available.");
      await this.context.audioWorklet.addModule(new URL("voice-worklet.js", location.href));
      if (!current()) return;
      const ws = new WebSocket(gatewayUrl); this.socket = ws;
      const timeout = setTimeout(() => { if (current()) this.fail("Voice connection timed out."); }, 12000);
      this.connectTimer = timeout;
      ws.onopen = () => {
        if (!current()) { ws.close(); return; }
        ws.send(JSON.stringify({ type: "start", token: this.token(), mode, conversationId }));
      };
      ws.onmessage = event => {
        if (!current()) return;
        try {
          const message = JSON.parse(event.data);
          if (message.type === "ready") {
            clearTimeout(timeout);
            this.input = this.context.createMediaStreamSource(stream);
            this.worklet = new AudioWorkletNode(this.context, "victor-microphone");
            this.worklet.port.onmessage = frame => {
              if (!current() || ws.readyState !== WebSocket.OPEN) return;
              if (ws.bufferedAmount > 64000) { this.fail("Voice connection is too slow. Start again or use text."); return; }
              ws.send(frame.data);
            };
            this.input.connect(this.worklet); this.worklet.connect(this.context.destination);
            if (muted) this.setMuted(true);
            this.onState("listening");
          } else if (message.type === "clear") {
            this.clearPlayback(); this.turn = message.turn;
          } else if (message.type === "audio") {
            if (message.turn === this.turn && !this.muted) this.play(message);
          } else if (message.type === "speechEnd") {
            this.playbackEnded = true;
            if (!this.sources.size) this.onState("listening");
          } else if (message.type === "transcript") this.onTranscript(message.text, message.final);
          else if (message.type === "reply") this.onReply(message);
          else if (message.type === "state") this.onState(message.state);
          else if (message.type === "error") this.onError(message.message);
        } catch { this.fail("Voice audio could not be read. Please start again."); }
      };
      ws.onerror = () => { if (current()) this.fail("Voice connection failed. Text chat is available."); };
      ws.onclose = () => { if (current()) this.stop(); };
    } catch (error) { if (current()) this.fail(error.name === "NotAllowedError" ? "Allow microphone access to use voice." : error.message); }
  }
  play(message) {
    if (message.sampleRate !== 24000) throw new Error("Unsupported sample rate");
    const bytes = Uint8Array.from(atob(message.audio), c => c.charCodeAt(0));
    if (!bytes.length || bytes.length % 2) throw new Error("Invalid PCM audio");
    const samples = new DataView(bytes.buffer);
    const buffer = this.context.createBuffer(1, bytes.length / 2, 24000);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) channel[i] = samples.getInt16(i * 2, true) / 32768;
    const start = Math.max(this.context.currentTime + 0.025, this.nextAudio || 0);
    if (start - this.context.currentTime > 30) throw new Error("Audio queue overflow");
    const source = this.context.createBufferSource(); source.buffer = buffer;
    source.connect(this.context.destination); this.sources.add(source);
    this.playbackEnded = false;
    source.onended = () => { this.sources.delete(source); source.disconnect(); if (!this.sources.size && this.playbackEnded && this.active) this.onState("listening"); };
    source.start(start); this.nextAudio = start + buffer.duration;
  }
  clearPlayback() {
    for (const source of this.sources) { source.onended = null; try { source.stop(); source.disconnect(); } catch {} }
    this.sources.clear(); this.nextAudio = 0; this.playbackEnded = false;
  }
  interrupt() {
    this.clearPlayback();
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type: "interrupt" }));
  }
  setMuted(muted) {
    this.muted = muted;
    if (muted) this.clearPlayback();
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type: "mute", muted }));
  }
  fail(message) { this.stop(); this.onError(message); }
  stop() {
    this.generation++; this.active = false; this.muted = false;
    clearTimeout(this.connectTimer); this.clearPlayback();
    this.worklet?.disconnect(); this.input?.disconnect();
    this.stream?.getTracks().forEach(track => track.stop());
    if (this.socket) { this.socket.onclose = null; this.socket.close(); }
    if (this.context) this.context.close().catch(() => {});
    this.worklet = this.input = this.stream = this.socket = this.context = null;
    this.onState("idle");
  }
};
