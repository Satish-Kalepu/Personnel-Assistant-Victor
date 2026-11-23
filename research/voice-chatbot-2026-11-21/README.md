# Fast, natural mobile voice: research findings

Research date: 2026-11-21. **Desk research complete; local demo/protocol checks added; physical-device experiments pending.** Optimized for individual conversation experience with no monthly-budget cutoff. Cost is reported separately.

**Owned-server POC added:** [experiment and measured results](12-owned-server-poc-report.md), [runnable code and setup](owned-server-poc/README.md). Real synthetic WebRTC → local VAD/endpoint → cloud STT/LLM/TTS → non-silent return audio passed. The measured 3.94 s endpoint-to-server-PCM run is an integration result, not a conversation-speed win; human/device acceptance remains pending.

**Staging integration live:** [release, tests and limitations](13-staging-owned-voice-integration.md). The app now uses a private owned Silero worker over its existing authenticated WSS PCM path. Correct complete synthetic input/reply/audio, live browser mute/Stop and access controls passed. One staging request took3.98s from final input chunk to first PCM, including endpoint wait; physical-device and speed acceptance remain open.

**2026-11-22 paused-fact repair verified:** [diagnosis and retention changes](14-paused-facts-retention-repair.md). Finalized statements now survive resumed speech independently of reply cancellation. All35 checks passed. After a separately approved checker correction, a fresh public synthetic account retained all three statements/facts across900ms gaps and returned nonzero audio. The earlier timeout/storage probe is retained in the report.

**Agent-loop clarification:** [current queue versus proposed single coordinator](15-single-agent-input-and-tool-loop.md). Serial input batching is implemented; an LLM-directed tool loop/inbox and guaranteed combined summary are a proposed next increment, IDEA-018 Discussing.

## Recommendation

Test **OpenAI GPT-Live 1.1 + WebRTC + a separate application reasoning/tool backend** first. Compare it directly against **Google Gemini 3.8 Live** and **OpenAI Realtime 2.1** before selecting a provider. This is an architecture-based starting recommendation, not a measured fastest-provider claim. [OpenAI Live](https://developers.openai.com/api/docs/guides/live), [Google Live model](https://aistudio.google.com/docs/models/gemini-3.8-live), [OpenAI architecture comparison](https://developers.openai.com/api/docs/guides/voice-agents).

The device should own immediate microphone/playback controls, echo handling and interruption. The voice layer should listen continuously and stream speech; slow tools and memory work should run through an authorized backend without unnecessarily blocking conversation. Measure first useful answer and task completion so a quick acknowledgement cannot hide a slow result.

```mermaid
flowchart LR
  P[Person] <-->|speech| D[Local audio and controls]
  D <-->|live media| V[Conversational voice model]
  V <-->|async tasks and results| B[Reasoning and tool backend]
  B --> M[Authorized memory and durable state]
```

This is the general design; transport and tool protocols differ by provider. Keep the existing AWS application backend initially and compare voice providers independently. A cloud model can feel locally responsive; this architecture does not put all intelligence offline on the phone.

## Best combinations to evaluate

| Need | Candidate |
|---|---|
| Continuous natural conversation with independent reasoning | GPT-Live 1.1 + WebRTC + Node backend/client delegation |
| Google-native alternative | Gemini 3.8 Live + constrained direct WSS or Firebase Kotlin/web path + backend tools |
| Unified OpenAI speech/reasoning | Realtime 2.1 + direct WebRTC + authorized private tools |
| Maximum component/voice control | LiveKit Node + Deepgram Flux + streaming LLM + Cartesia Sonic 3.6; compare ElevenLabs/Sarvam TTS |
| AWS-native speech | Nova 2.5 Sonic + persistent media bridge + AWS tool backend |
| Managed references | Azure Voice Live, ElevenAgents native/custom modes, Deepgram Voice Agent |
| Immediate device behavior/offline fallback | Local stop/mute/audio handling plus measured local speech/intent models |

The [platform study](02-platform-evidence.md) also covers AssemblyAI, Mistral, Gradium, Speechmatics, Soniox, Hume discovery, Pipecat/Daily, Groq, Cerebras, Vapi, Retell and open/self-hosted approaches. Each is placed at its actual layer rather than treated as a direct replacement for every other product.

## Main findings

- **End-to-end orchestration matters more than an isolated fast STT claim.** The current repository already streams STT/TTS but waits for a full reply/facts object and persistence before sending text to synthesis. This is an observed implementation limitation, not repaired here.
- **Full-duplex voice and ordinary barge-in are different capabilities.** Compare actual listening, overlap, pause and correction behavior, not just whether sockets are bidirectional.
- **Streaming cascades remain serious candidates.** Their text inspection and voice choice can justify them; compare a tuned cascade rather than assuming today's buffered pipeline represents its potential.
- **No ecosystem is a proven winner on the owner's device.** Regional routes, turn detection, speaker echo, Bluetooth buffering and model/tool correctness require experiments.
- **Fully local intelligence needs separate proof.** Current public ML Kit custom-agent support does not list Pixel 8a; local speech/intent models remain useful candidates. [ML Kit device list](https://developers.google.com/ml-kit/genai).

Proposed simple-turn goals are p50 useful-answer delay <=700 ms, p95 <=1,200 ms, with reliable interruption and good voice quality. These are targets, not observed results. Complex tasks and cold startup are measured separately.

## Read the study in stages

1. [Study protocol and hypotheses](00-study-protocol.md).
2. [Latency and current source baseline](01-latency-and-current-baseline.md).
3. [Platform evidence and combinations](02-platform-evidence.md).
4. [Architecture and engineering practices](03-architecture-and-best-practices.md).
5. [Decision matrix and skeptical review](04-decision-and-challenges.md).
6. [Reproducible benchmark protocol](05-benchmark-protocol.md), [30 scenario definitions](benchmark-cases.md), and [empty results template](benchmark-results-template.json).
7. [Per-conversation cost and operating notes](06-cost-and-operating-notes.md).
8. [Research execution log](07-research-log.md) and [83-entry primary-source register](sources.md).

## Architecture plans and authorized demo follow-up

The owner subsequently requested [two concrete plans with pros/cons](08-two-architecture-plans.md), then authorized [sample demo screens and initial testing](demo/README.md). Plan A uses direct OpenAI Live WebRTC with backend delegation; Plan B uses LiveKit client SDKs and a Gemini voice worker. See [the actual test report](09-demo-test-report.md) for passed browser/protocol checks, the approved harness correction, and unmeasured answer quality/timing. No production runtime change or subscription provisioning occurred. These follow-up checks include real paid synthetic OpenAI traffic; the original desk-research phase did not.

The owner also invited requests for additional provider access. See [private setup instructions and next tests](10-provider-access-and-next-tests.md). Existing OpenAI access is verified for the initial checks; the LiveKit/Gemini setup choice remains pending.

A separate proposed option is [an owned realtime voice gateway with backend speech/turn detection](11-own-realtime-voice-server.md), recorded as IDEA-017 Discussing. It distinguishes WebRTC transport from VAD, turn detection and agent orchestration; no existing plan is superseded.

Next empirical step: resolve complete-input/answer evidence in the primary protocol check, configure the secondary candidate, then compare Pixel/web trials using the same cases and correctness requirements. Architecture remains [IDEA-016](../../notes/ideas.md) Discussing.
