# Stage 1: latency, perception, and the current baseline

Date: 2026-11-21. Evidence labels follow [the protocol](00-study-protocol.md).

## What makes a device feel as though it is talking itself?

The useful objective is continuous conversational responsiveness: immediate local controls, clean audio, appropriate turn-taking, short useful answers, and fast recovery. A nearby server and fast transcription help, but neither proves this experience. Human conversation research found closely timed turns across ten languages; its roughly 208 ms mean response offset describes human interaction, not an achievable cloud-agent service guarantee. [Stivers et al., PNAS 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC2705608/).

Treat these as different measurements:

| Metric | Definition | What it exposes |
|---|---|---|
| Session-ready delay | Tap/activation to ready microphone and usable model connection | Permission, TLS/ICE, auth, model loading |
| Caption delay | Spoken word/acoustic boundary to displayed stable text | Streaming recognition and UI |
| Turn-response gap | Last user phoneme of an annotated completed turn to first audible assistant speech | Entire device-to-device path |
| Useful-answer delay | Same boundary to first audible task-relevant answer, excluding generic acknowledgements | Whether fast speech hides slow reasoning |
| Task completion time | Request to verified result/action completion | Tools, reasoning, confirmation, execution |
| Barge-in yield | Start of a deliberate interruption to cessation of unwanted assistant speech at the speaker | VAD, cancellation, queued playback |
| False turn-end rate | Turns interrupted by the assistant before the speaker intended to finish | Aggressive endpointing |
| False interruption rate | Non-interrupting noise/backchannels that suppress a useful reply | Poor echo/noise/intent handling |
| Glitches and stale speech | Underruns, clicks, or obsolete audio played per session | Buffering and race conditions |

For genuine overlap, allow negative turn-response gaps and annotate whether overlap was appropriate. Do not clamp them to zero or count every backchannel as an answer. Provider first byte, transcript-final time, server synthesis time, and device audible onset are different clocks/events.

## Where delay accumulates

For a conventional non-overlapped turn, a conceptual approximation is:

`gap = endpointing + remaining recognition + routing/network + LLM time to speakable content + TTS first audio + playout buffering`

For a streaming/duplex system, several spans overlap. Use a trace dependency graph and critical path; adding all span durations can double-count concurrent work. A model may process audio during speech without being able to safely finish an answer before the request is complete.

**DESIGN INFERENCE:** A sequential delay budget for a simple warm turn could allocate 200 ms to endpointing, 100 ms to remaining recognition/routing, 200 ms to first useful LLM content, 100 ms to initial synthesis, and 100 ms to delivery/playout: 700 ms total. This is arithmetic for design, not measured provider performance or a promise. Some native audio architectures do not expose these stages separately.

**VENDOR CLAIM caution:** ElevenLabs now explicitly distinguishes warm-voice server-side median synthesis latency from client latency. Its methodology page gives about 100 ms for v4 Turbo and Flash v2.5, while an older marketing page still advertises about 75 ms for Flash. Use the methodology and test the complete route; neither number describes a full agent response. [Methodology](https://elevenlabs.io/docs/eleven-api/concepts/latency-methodology), [latency guide](https://elevenlabs.io/docs/eleven-api/guides/how-to/best-practices/latency-optimization).

## Current repository: source observations, not fresh benchmarks

The active implementation is under `services/api/`; the older `voice-gateway/` and Python backend are historical context. Reviewed source as present on 2026-11-21:

| Observation | Local evidence | Implication |
|---|---|---|
| Saaras v4 realtime STT, `fast`, English India, VAD silence 650 ms | [sarvam.mjs](../../services/api/src/voice/sarvam.mjs) | Recognition streams, but the configured silence wait remains material |
| Final transcript starts a reply; partials update the UI | [session.mjs](../../services/api/src/voice/session.mjs) | No speculative reasoning from provisional turn events in this path |
| Responses call returns a full JSON object containing reply and facts | [model.ts](../../services/api/src/model.ts) | No first-clause model streaming into TTS |
| Voice reasoning effort is already `none`; spoken prompt already asks for concise replies | [model.ts](../../services/api/src/model.ts) | Recommending only shorter answers or less reasoning would miss existing optimizations |
| Reply/facts are validated and persistence runs before returning the chat response | [assistant.ts](../../services/api/src/assistant.ts) | Memory work and response completion are on the speech critical path |
| TTS socket prewarms while chat runs; synthesis text arrives after owned-message checks | [session.mjs](../../services/api/src/voice/session.mjs) | Handshake overlap already exists; adding it is not a new proposal |
| Interruption increments a generation, cancels local work, closes TTS and sends clear | [session.mjs](../../services/api/src/voice/session.mjs) | Useful cancellation foundation; audible yield remains unmeasured |

**Finding:** Whole-response processing is a credible bottleneck even with streaming STT/TTS. This is consistent with existing [DEBT-008](../../notes/tech-debt.md), not a new defect repaired in this study. Shortening endpointing alone trades wait time for premature interruptions and leaves the JSON/persistence gate intact.

**HISTORICAL MEASUREMENT:** Existing notes record synthetic first-audio observations of 3.66 seconds locally and 2.58 seconds through EC2. The earlier standalone speech test recorded 692 ms connect-to-first-PCM. These use different scopes and are not a controlled comparison or microphone-to-speaker measurements. No new calls were made and no current latency percentile is known. [Prior voice research](../../docs/voice-research-2026-11-19.md), [debt record](../../notes/tech-debt.md).

## Proposed experience targets

These are ambitious research goals for simple, correctly answered warm-session turns on a good network, not vendor SLAs:

| Dimension | Proposed goal | Caveat |
|---|---|---|
| Useful-answer delay | p50 <=700 ms; p95 <=1,200 ms | Tools/complex reasoning reported separately |
| Barge-in yield | p50 <=150 ms; p95 <=250 ms | Measure at speaker; distinguish noise and backchannels |
| Local stop button | p95 <=100 ms | Should not wait for a cloud cancellation |
| Intended completed turns answered | >=99% in defined trial | Include timeouts/failures in the denominator |
| Premature ends | <=2% in pause/correction trials | A fast wrong interruption fails experience goals |
| Voice naturalness | Owner preference plus blinded ratings | No provider declared winner by documentation |

Report cold start separately. Do not promise 200 ms factual responses to arbitrary complex questions. More money can purchase appropriate tiers, placement, warm capacity or better voices, but cannot eliminate network distance, missing facts, or required tool work.
