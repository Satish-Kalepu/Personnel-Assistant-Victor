# Stage 4: reproducible experiment protocol

Date: 2026-11-21. **Execution status: NOT RUN.** No new audio, paid API traffic, provider sessions or device measurements were created for this study.

## Experimental question

Does a continuous/native voice architecture improve the owner's conversational experience over the existing pipeline while preserving useful answers, accurate tasks, interruption handling and application boundaries?

Pre-register hypotheses and evaluation rules before looking at trial results. Use [benchmark-cases.md](benchmark-cases.md) as a starting corpus and [benchmark-results-template.json](benchmark-results-template.json) as an empty recording template. All example names/numbers/facts are fictional test data.

## Arms and staged execution

| Arm | Configuration | Purpose |
|---|---|---|
| C0 | Current OpenAI + Sarvam pipeline, unchanged | Control; establish a fresh baseline |
| N1 | GPT-Live 1.1 + existing backend through client delegation + direct WebRTC | Continuous frontend hypothesis |
| N2 | Gemini 3.8 Live + authorized async tools, direct Developer API WSS | Google native challenger |
| N3 | OpenAI Realtime 2.1 + same authorized tools, direct WebRTC | Unified OpenAI control |
| P1 | LiveKit Node + Flux + current streamed text model + Sonic 3.6 | Optimized independent cascade |
| A1 | Nova 2.5 Sonic with persistent WebRTC/media bridge | AWS-native challenger |
| M1 | Azure Voice Live with selected documented model and WebRTC | Managed Microsoft challenger |
| E1/E2 | ElevenAgents Realtime Mini/Max | Native managed voice references; validate mode eligibility |

First complete smoke integration for each arm using synthetic ordinary test data. Failures are recorded as capability failures, not omitted. Then screen all runnable arms on a common device/network/route before advancing the strongest candidates to a larger test. Screening order is an execution convenience, not a platform-quality conclusion.

In P1 hold STT/framework/LLM fixed while comparing Cartesia, ElevenLabs and Sarvam TTS. Hold other components fixed while comparing Flux with Sarvam/AssemblyAI/Scribe/Mistral STT as needed. Do not change every component simultaneously and claim to know which caused an improvement. Compare framework variants separately if media/turn handling remains the bottleneck.

Optional O1 is local speech/intent/LLM/TTS on Pixel, plus a separate GPU self-hosted arm if desired. Do not label a GPU-backed local-network demo as fully on-device.

## Separate tasks by information needs

Run (a) conversational turns with no tools, (b) memory-dependent questions, (c) a deterministic single-tool task, and (d) complex reasoning/multi-tool work as separate strata. The same mandatory backend/tool requirements must apply across comparable arms; native models must not answer a required lookup from guesswork.

Add a controlled tool fixture returning a fixed result after 0, 250, 1,000 and 3,000 ms. These are **experimental delays**, not predicted production latency. This reveals whether a frontend masks latency with acknowledgements or meaningfully handles corrections while waiting. Pure speech/conversation can be measured independently of the fixture.

## Devices and conditions

Required clients: the owner's Pixel 8a on its actual installed Android version, desktop Chrome, and the Android browser. Add Edge/iOS only when included in release scope. Record build, OS, browser version, battery/thermal state, model snapshot, voice, SDK/plugin versions and all turn/buffer settings.

Separate audio routes: phone speaker, wired headset if available, and Bluetooth. Speaker tests must include double-talk so echo suppression is actually exercised. Include quiet and reproducible moderate background noise; record noise source/level and microphone distance. Do not apply server noise reduction twice by accident.

Separate real Wi-Fi, real cellular, and controlled degraded networks. A useful emulator grid adds 0/50/150 ms RTT, 0/20/50 ms jitter, and 0/1/3% loss, one factor at a time before representative combinations. Record these as added impairments plus the observed baseline. Synthetic impairment does not reproduce every mobile radio issue. Log RTC selected transport/TURN use and observed loss/jitter when available.

For region experiments, record the actual selected API surface, requested region, exposed serving-region metadata, worker region and tool/data region. An endpoint name alone is not a processing-location measurement.

## Audio measurement: avoid misleading server charts

The primary score is measured at the client audio boundary and verified acoustically on a subset. Capture source speech and actual assistant speaker output on synchronized, distinguishable channels using a calibrated external recording arrangement. Annotate the intended end of user turns and the onset of task-relevant assistant content. A recording that cannot separate echo, overlapping speech or the two channels is not sufficient ground truth.

An AudioWorklet/Android playback timestamp is a useful application estimate, not proof of speaker onset. Calibrate device output delay per route using a known test signal. Browser callbacks, Bluetooth buffering and echo cancellation can shift timing. Record calibration uncertainty and scoring thresholds. Manually audit low-amplitude or ambiguous onsets.

Use one monotonic clock per process. Use event IDs and synchronization to correlate server/client traces; never subtract unrelated unsynchronized clock values. Preserve raw local timestamps and calibration method. Do not double-count overlapped spans. Acoustic measurements should use a shared recording clock so the primary user-end/output-onset difference does not depend on server clock synchronization.

Instrumentation events should include session/request/generation IDs plus these timestamps when exposed:

- activation, permission completion, media/model ready;
- actual user speech start/end and intended turn end;
- first/final transcript, provider/framework turn end;
- LLM/delegation start, first token, first speakable useful clause;
- tool start/result/commit, memory extraction and persistence completion;
- first synthesized PCM received, playout scheduled and acoustic output onset;
- interruption onset, local clear, upstream cancel and acoustic yield;
- timeout, disconnect, restart, stale-result rejection, usage summary.

Some native models do not expose internal STT/LLM/TTS timings. Mark those fields unavailable; do not reverse-engineer a fictional breakdown. Compare observable end-to-end results fairly.

## Sample size and bias controls

Screening: 30 base scenarios x 3 repeats = 90 trials per runnable arm under a shared warm, quiet Wi-Fi condition. Run cold startup separately at least 20 times per arm. Multi-turn scenarios need complete sessions rather than isolated sentences; annotate their eligible turns individually. These are exploratory samples, not strong tail-latency evidence.

Finalists: use at least 100 eligible turns per important condition across multiple sessions, speakers and time windows. Report confidence intervals and increase samples if p95/preference uncertainty is large. Do not pretend an exact sample size guarantees a stable tail. Use session/speaker-clustered resampling for uncertainty rather than treating correlated turns as independent. Predefine a maximum duration and a consistent timeout policy.

Randomize/counterbalance provider order and condition order; warm every arm consistently. Use paired source material for automated tests and a live-interaction subset for genuine overlap. Keep prompts/task requirements comparable; record unavoidable model-specific settings and test them as variants. Avoid giving one model a permissive short-answer prompt and another a long policy prompt without disclosing it.

Do not reuse only one provider's synthetic voice as the user corpus: test several voices, real consenting speakers and Indian English. Blind the provider labels and normalize playback loudness during preference listening; preserve natural pacing and do not edit out real silence. Ask the owner for paired preference and the reason; a panel can supplement this but cannot override the owner's desired voice.

## Metrics and scoring rules

For each stratum/condition, report p50, p90, p95 and sample counts for turn-response gap, useful-answer delay and barge-in yield. Report startup and task completion separately. Identify whether percentiles summarize turns or session means; do not mix them. Show response-success, task-success, premature-end, false-interruption, correction-handling, glitch and stale-audio rates with denominators.

Latency distributions contain only observed values, but **all eligible turns** remain in response-success and timeout counts. Include censored/failed requests in a separate outcome table and report completion by fixed deadlines; do not silently drop failures or assign them a made-up observed latency. Report overlapping/backchannel behavior and whether it was helpful.

Use word error rate only where an appropriate transcript exists, supplemented with semantic errors, critical-name/number accuracy, and downstream task correctness. Native-model auxiliary transcripts are not guaranteed to be the exact internal representation or an exact word-for-word record of heard output. The audible result and verified application state are authoritative for task scoring.

Human ratings: naturalness, appropriateness of pauses, interruptibility, accent/pronunciation, voice consistency, helpfulness and overall “feels like the device is talking” preference. Use paired judgments and disclose rater count. Automated audio/model judges can provide diagnostics; they are not a replacement for actual listening and deterministic action checks.

The design is informed by [OpenAI's voice-agent evaluation guide](https://developers.openai.com/cookbook/examples/audio/voice_agent_evaluation) and [TurnBench](https://github.com/SesameAILabs/turnbench). TurnBench data is gated and separately licensed with non-commercial/no-voice-cloning restrictions; it has not been downloaded here. Use owner-created fixtures or review that license before incorporating it.

## Ablations that reveal the cause

1. Current baseline versus the same models with first-clause streaming and extraction separated, subject to approved implementation scope.
2. Fixed-silence endpointing versus semantic/turn-aware detection.
3. Speculation off/on, with cancellation and false-start counts.
4. Current versus shorter playout buffering, with glitches included.
5. Direct provider media versus framework media worker; compare actual route.
6. Current versus premium/capacity tier only where the chosen model supports it.
7. Same voice/model with and without required output approval gating.
8. Short versus realistic long-history sessions and memory/tool loads.

## Selection and completion criteria

Correctness, user/mode isolation and absence of unauthorized duplicate actions are mandatory. Then identify the preference/latency frontier: useful-answer timing, reliable interruption and human naturalness. Compare the proposed goals in Stage 1, rather than weakening them after observing a favorite provider. Cost is not a pass/fail criterion.

Declare a winner only with measured results and adequate uncertainty reporting. If different arms win conversation, exact speech or complex tasks, recommend task-specific routing and test transitions. If no arm meets the desired experience, report that and identify the dominant remaining delay. A research document, working handshake or single synthetic phrase is not device acceptance.
