export class ScenarioRunner {
  constructor(emit, clock = globalThis) { this.emit = emit; this.clock = clock; this.pending = []; this.generation = 0; }
  stop(reason = 'cancelled') {
    this.generation++;
    for (const timer of this.pending) this.clock.clearTimeout(timer);
    this.pending = [];
    this.emit({ type: 'clear', reason });
  }
  run(kind, muted = false) {
    this.stop('new scenario');
    const generation = this.generation;
    const later = (at, event) => this.pending.push(this.clock.setTimeout(() => {
      if (generation === this.generation) this.emit(event);
    }, at));
    this.emit({ type: 'state', value: 'listening' });
    later(300, { type: 'caption', role: 'user', text: kind === 'lookup' ? 'What is the status of order TEST-ALPHA?' : kind === 'correction' ? 'Tuesday… sorry, Wednesday.' : 'What is twelve times thirteen?' });
    later(1050, { type: 'state', value: 'thinking' });
    later(1100, { type: 'task', text: kind === 'lookup' ? 'A fictional backend lookup is running.' : 'The backend checks the fixture.' });
    const end = kind === 'lookup' ? 3700 : 1750;
    later(end, { type: 'caption', role: 'assistant', text: kind === 'lookup' ? 'The fictional order TEST-ALPHA has shipped.' : kind === 'correction' ? 'Wednesday. I have only updated this demo; no reminder was created.' : 'Twelve times thirteen is one hundred and fifty-six.' });
    later(end, { type: 'state', value: muted ? 'muted' : 'speaking' });
    later(end + 1200, { type: 'state', value: 'complete' });
  }
}
