# Initial demo and protocol test report

Date: 2026-11-21. Authorized in prompt 014; test-harness correction explicitly approved in prompt 015. This report supplements the original desk study and does not declare a measured provider winner.

## Scope and isolation

Created [a local demo lab](demo/README.md) with two responsive architecture screens and one OpenAI Live integration. The lab uses a loopback server and in-memory fictional fixtures. No production login, database, Redis data, application source, deployment or allowance settings were changed. No human microphone input or raw audio file was captured/saved by the tests.

## Verification results

| Check | Result | What it establishes |
|---|---|---|
| JavaScript syntax | Passed for browser controller; final source checks recorded in prompt | Source parses; not device acceptance |
| Cancellation generation | Passed | Old scripted callbacks cannot emit captions after interrupt/architecture change |
| Replayed fixture delegation | Passed | Same delegation ID returns at most one fixture result; stopped coordinator discards pending work |
| Local HTTP boundaries | Passed | Config response excludes fixture secret, source/env paths are not served, foreign-origin mutations rejected, invalid SDP rejected |
| Corrected first-audio timing, two focused cases | Passed | First audio recorded once, negative overlap preserved, unknown reference stays null |
| Desktop web at 1440 px | Passed | Both architecture screens render without horizontal overflow |
| Mobile web at 390 px | Passed | Responsive layout without horizontal overflow; this is not an Android SDK test |
| Browser quick-answer/correction scenarios | Passed | Scripted captions and lifecycle complete correctly |
| Browser slow-lookup interruption | Passed | No stale assistant response after interrupt |
| Secondary live setup state | Passed | Start is disabled with an explicit Gemini/LiveKit setup explanation |
| Microphone denial | Passed with synthetic browser rejection | Error is clear; Start re-enabled, Stop disabled; no provider session requested |
| OpenAI primary server WebSocket smoke | Audio received and final usage received | Model session can accept a connection and return audio to this account |
| OpenAI browser WebRTC | Session connected with synthetic silent media track; Stop ended track | Browser signaling/RTC session path works; no physical mic or audible quality test |
| Correct spoken answer | Unscored | Synthetic run input transcript incomplete, output transcript empty |
| Useful-answer/acoustic latency | Unmeasured | No calibrated complete input/answer evidence |
| Gemini/LiveKit live comparison | Not run | Media project/agent worker/provider setup absent from lab |

Five focused automated tests passed using `node --test --test-isolation=none`. The ordinary isolated Node runner initially failed with sandbox `spawn EPERM`; the in-process test mode passed without a global environment change. Browser scenario checks reported no page JavaScript exceptions. A missing favicon produced a non-functional 404; no unrelated repair was made.

## Timing finding, consent and correction

The first synthetic report contained a 68 ms field while only a fragment of the input transcript was captured and no output transcript was present. Inspection found that when the first output arrived before the harness recorded input end, the field could later be populated from a subsequent chunk. This cannot support a speed claim.

The owner explicitly approved the narrow repair in [prompt 015](../../prompts/2026-11-21-015-approve-demo-timing-harness-correction.md). The [original report](demo/provider-smoke-results-original-invalid-timing.json) was preserved. The [corrected timing module](demo/audio-timing.mjs) records first audio exactly once and reports signed overlap only when both reference timestamps exist. Focused tests cover first audio preceding input end, later chunks, repeated end events, and missing reference time.

One corrected [synthetic run](demo/provider-smoke-results.json) received 230,400 bytes of output PCM and a final usage event. The input transcript remained incomplete and the output transcript remained empty. The corrected timing is **null**, answer correctness is **unscored**, and the expected-answer transcript diagnostic is false. Audio transport is demonstrated; neither a correct 156 answer nor a measured useful-answer delay is established. Do not infer poor or excellent voice quality from this result.

The early session ending/incomplete transcription still needs protocol/event and acoustic investigation before a scored benchmark. No unapproved provider or production repair was attempted. The browser WebRTC connection was separately exercised with synthetic silent media; it does not resolve the speech/transcript gap.

## Evidence artifacts

- [Architecture plans and pros/cons](08-two-architecture-plans.md).
- [Local lab and run instructions](demo/README.md).
- [Five focused checks](demo/test/lab.test.mjs).
- [Plan A desktop screen](demo/screenshots/plan-a-desktop.png).
- [Plan B desktop screen](demo/screenshots/plan-b-desktop.png).
- [Plan B mobile-web screen](demo/screenshots/plan-b-mobile.png).
- Original and corrected sanitized provider reports linked above. No credentials are included.

## Next acceptance gates

Finish the OpenAI input/transcript/answer protocol investigation, test a complete audible turn, and calibrate timing. Configure the Gemini/LiveKit candidate for a comparable live run. Then compile the chosen Android adapter and run physical Pixel microphone/speaker/headset trials and owner listening preference. Finally execute the controlled scenario study with matched conditions. These gates remain open; screenshots and smoke checks do not complete TASK-013/device voice acceptance or finalize IDEA-016.
