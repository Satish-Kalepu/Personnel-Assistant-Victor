# Experiment: our server owns speech detection and agent routing

Date: 2026-11-21. IDEA-017 / TASK-018; authorization in [prompt 018](../../prompts/2026-11-21-018-build-owned-voice-server-poc.md).

## Question and scope

Can our backend receive a live WebRTC audio stream, identify speech start/end, apply its own endpoint rule and trigger an agent that returns speech through the same connection?

**Yes in synthetic localhost experiments.** This is a working integration proof, not evidence of acceptable human conversation speed or production readiness. The lightweight Python worker is an isolated experiment; the existing TypeScript app, database and deployment remain unchanged.

Implementation and run instructions: [owned-server-poc](owned-server-poc/README.md).

## Method

Browser/Python aiortc client → real WebRTC/Opus → aiortc server → mono 16 kHz PCM → local Silero ONNX CPU VAD on 32 ms frames → three-frame start filter/hysteresis → chosen silence endpoint → local agent or Sarvam realtime STT / streamed OpenAI response / Sarvam streaming TTS → PCM resampling and WebRTC return audio.

Default endpoint is 640 ms, with 320/960 ms alternatives. Server pre-roll is nine frames (288 ms) to preserve the beginning of speech. STT begins during speech and receives explicit manual start/end events. Text clauses can flow into synthesis while the model continues generating. New speech advances the session generation and cancels the prior agent/reply queue. A late transcript from a superseded generation cannot start a response.

Stimulus: one cached **AI-generated** phrase, “Hello Victor. What is twelve times thirteen?” No human microphone was used. Existing private API credentials were used; no new subscription/account and no production data. Cloud privacy switch was enabled only in the test server process; saved root `.env` was not edited.

Pinned runtime: Python 3.14; aiortc 1.16.0, aiohttp 3.14.5, NumPy 2.5.5, ONNX Runtime 1.32.0. Silero model commit and SHA-256 are recorded in [model-manifest.json](owned-server-poc/model-manifest.json); installed dependency versions in [requirements.lock.txt](owned-server-poc/requirements.lock.txt).

## Results

| Check | Observation | Conclusion |
|---|---|---|
| Seven core tests | All passed: ONNX silence rejection, spike filter, pause/hysteresis, endpoint presets/reset, queued playback clear, task cancellation and superseded-transcript suppression | Core boundaries and cancellation mechanisms work within test scope |
| Python local WebRTC | One speech start/end/turn; local agent executed; 11 decoded return frames above amplitude threshold | Real media transport and local routing work; tone is not an intelligent reply |
| Python cloud WebRTC | Final STT: “Hello Victor, what is 12 times 13?”; completed answer: “12 times 13 is 156.”; 49 non-silent decoded return frames | Complete synthetic input → agent → speech chain works |
| Cloud stage timing | 3941 ms endpoint → first server PCM, one run | Not yet the desired fast conversation; excludes 640 ms endpoint wait and acoustic/device buffering |
| Initial browser replay | WebRTC/data channel and VAD speech start worked; incoming frames stopped at114 after clip end | Initial failure retained; prompt020 approved two seconds of trailing silence, then turn/Stop/End checks passed |
| Same-origin negative check | POST without required origin/header rejected with 403 | Local request boundary check works; not production authentication |
| Browser cleanup/permission/layout | End cleared remote media; simulated permission denial restored Start; 1440/390 px layouts had no horizontal overflow; screenshots visually reviewed | Screen and negative paths checked; actual microphone remains untested |

Raw synthetic evidence: [local](owned-server-poc/evidence-local.json), [cloud](owned-server-poc/evidence-cloud.json), [initial browser failure](owned-server-poc/evidence-browser-initial.json). Do not discard a failed observation when reporting a later pass.

Browser status: [evidence](owned-server-poc/evidence-browser.json), [desktop screen](owned-server-poc/screenshots/desktop-ready.png), [mobile screen](owned-server-poc/screenshots/mobile-ready.png). Unused CSS import and missing favicon were corrected only after scoped owner approval in [prompt019](../../prompts/2026-11-21-019-approve-poc-cosmetic-fixes.md); fresh reload had zero console errors. Prompt020 approved the separate trailing-silence correction, now applied and checked. Research-browser energy sampling was inconclusive; nonzero audio is independently verified in the Python WebRTC test and [staging app experiment](13-staging-owned-voice-integration.md).

Cloud timing decomposition from the same server clock:

| Stage | Observed interval |
|---|---:|
| Backend endpoint → finalized STT | 289 ms |
| Finalized STT / agent start → first LLM text delta | 3246 ms |
| First → last LLM delta | 40 ms |
| Last text delta → first server PCM | 366 ms |
| Endpoint → first server PCM | 3941 ms |

These are one request’s observations, including provider/network scheduling. They do not isolate model compute or establish p50/p95. The largest observed delay was before the first LLM delta. Short replies may be sent to TTS only when their text stream completes; a longer reply can cross the clause threshold sooner.

One early cloud attempt received the single-session guard’s 409; a later attempt passed. No source change was applied for that response, and the precise contention cause was not established. Repeated-connect/recovery testing remains follow-up work.

## Next experiments before choosing an architecture

1. Completed: approved synthetic replay correction and turn/Stop/End recheck. Permission-denial and responsive ready-screen checks complete; initial failures retained. Owned detection is now integrated on staging; see experiment13.
2. Human microphone/speaker run on this computer, then Pixel 8a: sentence-end feel, thinking pauses, echo, barge-in, Bluetooth and reconnect behavior. Use the existing research scenario protocol.
3. Compare a warmed cascade and native realtime-audio candidate on the same network/device and questions. Record last spoken phoneme → first useful audible answer, interruptions and correctness. Do not tune the silence timer down merely to hide model delay.
4. Decide between direct provider media and an owned gateway only after those results. If the owned gateway wins on requirements, evaluate LiveKit/SFU/TURN, authenticated backend tools and deployment separately.

Production architecture remains Discussing. This experiment finalizes only the owner-approved POC scope. Follow-up limitations are tracked in DEBT-012; broader device acceptance remains separate from TASK-018.
