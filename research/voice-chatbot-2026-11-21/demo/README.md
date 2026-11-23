# Victor voice architecture lab

Local research prototype for the [two architecture plans](../08-two-architecture-plans.md). This is separate from the deployed assistant. It does not connect to production authentication, MongoDB, Redis or personal memory.

## Run locally

From the repository root in PowerShell:

```powershell
node research/voice-chatbot-2026-11-21/demo/server.mjs
```

Open **http://127.0.0.1:4317/** in a local browser. Stop the preview with Ctrl+C. The QA preview was stopped after verification; restart it with this command to try the screens.

Requires the existing `services/api/node_modules/ws` dependency. No separate dependency installation was needed for this lab. The server binds only to loopback and serves an explicit list of public assets, never repository source or environment files.

## What works

- Two responsive architecture screens: OpenAI continuous voice and Gemini/LiveKit managed agent.
- Three scripted scenarios: quick answer, slow backend lookup and a corrected request. These run without microphone or provider calls; delays are identical prescribed UI timing, not provider-speed estimates.
- Immediate scenario cancellation, reset, output-mute control and an event timeline. Simulation shows captions and animation; it does not synthesize vendor voices.
- Plan A live browser WebRTC connection through server-created GPT-Live sessions. The server reads the existing root `OPENAI_API_KEY` privately or uses the process environment. No key is returned to the browser.
- A small private sideband fixture handler for fictional order TEST-ALPHA and twelve-times-thirteen. This is a deterministic research fixture, not the production agent, memory implementation or a complete natural-language workflow.
- Local live sessions have a two-minute test ceiling and one active session at a time. Starting one can incur API charges. Microphone use requires an explicit browser gesture; media streams to OpenAI. The lab does not persist microphone audio or transcripts; provider data policies remain separate.

Plan B live audio is explicitly unavailable until a LiveKit media project/agent worker and the selected Gemini integration are configured. Its simulation screen is usable now. No service was purchased/provisioned and no keys are requested in the page.

## Verified versus pending

See [the test report](../09-demo-test-report.md). Five focused automated checks pass. Desktop/mobile web layouts and scenario/cancellation behavior were browser-tested. OpenAI primary WebSocket synthetic audio and real browser WebRTC negotiation succeeded, but answer correctness/useful-answer timing remain unscored. No physical microphone, Pixel APK, speaker acoustic latency, voice preference or matched Google comparison was tested.

The initial timing report is retained as [invalid historical evidence](provider-smoke-results-original-invalid-timing.json). Its 68 ms field is not a latency result: the original harness could select a later audio chunk. Owner approved a scoped correction in [prompt 015](../../../prompts/2026-11-21-015-approve-demo-timing-harness-correction.md). The corrected [report](provider-smoke-results.json) captures first audio once and leaves timing null when an input-end reference was not observed. Do not compare providers using either smoke report.

## Run checks

```powershell
node --test --test-isolation=none research/voice-chatbot-2026-11-21/demo/test/lab.test.mjs
```

The no-isolation flag avoids this environment's restriction on test-runner subprocess creation; no global configuration was changed.

The following command makes a real paid synthetic provider check using the configured server key. It generates a harmless spoken arithmetic question, streams it over the Live server WebSocket, and records sanitized protocol evidence. It never uses a microphone or saves raw audio:

```powershell
node research/voice-chatbot-2026-11-21/demo/smoke-live.mjs
```

This is a protocol smoke test, not a calibrated benchmark. It writes `provider-smoke-results.json`; preserve prior reports before rerunning if needed. The controlled 30-scenario study remains pending.

## Screen previews

- [Plan A desktop](screenshots/plan-a-desktop.png).
- [Plan B desktop](screenshots/plan-b-desktop.png).
- [Plan B mobile web](screenshots/plan-b-mobile.png).

These are browser screenshots, not Android app screenshots. Native Kotlin/media integration is still a proposed implementation step.
