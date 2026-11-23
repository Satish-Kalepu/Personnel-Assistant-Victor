export class FirstAudioTiming {
  firstAudioAt = null;
  inputEndedAt = null;
  audio(at) { this.firstAudioAt ??= at; }
  endInput(at) { this.inputEndedAt ??= at; }
  summary() {
    const offset = this.firstAudioAt !== null && this.inputEndedAt !== null
      ? Math.round(this.firstAudioAt - this.inputEndedAt) : null;
    return {
      firstReceivedAudioMinusInputEndMs: offset,
      firstAudioBeforeInputEnd: offset === null ? null : offset < 0,
      metric: 'First received audio chunk, including acknowledgements; not useful-answer or acoustic latency',
    };
  }
}
