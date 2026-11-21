# Voice architecture demo testing - 2026-11-21

## Prompt

Ofcourse. I guess Testing is pending as per our research . if you want go ahead with testing first by creating sample demo screens.

## Questions and decisions

- Owner authorizes sample demo screens and testing as the next stage of the active two-plan architecture work (prompt 013).
- Preserve both architecture proposals; building/testing demos is not a final provider selection or production migration.
- Distinguish simulated UI/protocol tests, real-provider synthetic checks, and actual phone/microphone/listening acceptance. Never report synthetic/demo timings as measured device performance.

## Actions

- Used Sites local-checkout/preview workflow for the requested repository research prototype; no hosted Site or production deployment created.
- Built a loopback Node server and responsive two-plan lab with explicit scenario/live modes, three scripted scenarios, captions, stop/mute/reset, state/events and unmeasured metrics.
- Added isolated OpenAI WebRTC session creation/private fixture coordinator and synthetic primary-WebSocket smoke check. Plan B live remains explicitly unavailable until service/worker setup.
- Ran browser scenario, cancellation, permission-denial, responsive-layout and real WebRTC negotiation checks using a synthetic silent track. No physical microphone was read.
- Discovered a new harness timing defect; requested and received consent in prompt 015 before correcting it. Preserved the invalid original report and wrote a corrected report with timing null/correctness unscored.

## Files changed

- research/voice-chatbot-2026-11-21/demo/: local server/provider adapter, browser HTML/CSS/JS/scenario runner, package scripts, timing module, tests, synthetic checker, two provider reports, browser QA evidence, private-setting-name example, README and three screenshots.
- research/voice-chatbot-2026-11-21/09-demo-test-report.md plus shared study index/log, prompts, idea and diary records. Provider setup instructions are tracked in prompt 016.
- No production app, deployed services, authentication/database/allowance settings or subscriptions changed. Real secrets were not copied to artifacts.

## Verification

- Five focused automated checks passed; JS syntax and JSON parsing passed. Ordinary Node test isolation hit sandbox spawn EPERM; in-process test mode passed without global configuration change.
- Browser checks passed: quick/correction scenarios, no stale lookup reply after interruption, explicit secondary setup state, simulated permission denial cleanup, desktop 1440px/mobile-web 390px without horizontal overflow. Screenshot layouts visually inspected.
- Real OpenAI browser WebRTC session connected using a synthetic silent track; Stop ended the track. Primary server WebSocket synthetic input check received PCM and final usage; incomplete input/output transcript evidence prevents answer correctness or useful-answer latency scoring.
- Source/env path exclusion, foreign-origin mutation rejection, invalid SDP handling, replay/cancellation and corrected timing behavior checked. Value-free scan found no actual provider secret in research artifacts. 65 local links resolved across 34 files at validation.
- Controlled benchmark, physical Pixel/APK/audio route, voice preference and Gemini/LiveKit live tests remain pending. A favicon 404 was observed; no unrelated repair.
- QA preview server stopped during teardown; demo can be restarted using its README command.

## Outcome

- Sample screens, local prototype and initial checks complete, with limits and actual evidence in the test report. Full comparative voice acceptance remains open; no measured provider winner claimed.
