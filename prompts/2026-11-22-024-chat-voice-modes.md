# Add press-to-speak and live conversation UI — 2026-11-22

## Prompt

okay.  in frontend chat I want  press and speak button,  and a live mode button .  when I click live mode it should change the screen theme to make user realize that it is in a zone .

## Questions and decisions

- Owner explicitly requests two frontend voice entry points and a distinct live conversation theme.
- Ask whether Press and speak is hold/release, dictation or tap-to-finish; implement independent live UI while that choice is pending.
- Keep existing authenticated backend, STT/LLM/TTS providers, memory separation and stop/logout lifecycle. Verify new voice controls and responsive theme before staging publication under the existing Git workflow.

## Actions

- Added two controls and a distinct live theme/status/exit, preserving normal chat and mode separation. Optional press question remained unanswered beyond grace, so visibly selected hold/release as an implementation assumption.
- Added authenticated optional push-to-talk input mode and user-ended manual STT; held input queues until release. Flush partial microphone frame, stop physical capture on release and close only after reply playback (or muted text completion). Live still uses existing owned VAD.
- Added manual STT/queue/cancel/empty and browser audio resource/flush tests; builds and26 checks pass. Initial live desktop/mobile preview has no overflow. Final pointer/keyboard fixture missed Vite cache-query URL; diagnosed test-only matcher issue and requested explicit correction consent.

## Files changed

- web/index.html, app.js, styles.css, voice.js, public/voice-worklet.js and frontend test; backend voice route/session/Sarvam/manual adapter and tests; deployment regression/acceptance helpers, README/feature docs and prompt/idea/task/debt/diary records. No keys/config/data changed.

## Verification

- API/web builds and JS syntax pass.40 full isolated backend/integration tests and4 frontend/worklet tests pass, including private manual STT handshake, held-pause queue, release/cancel/empty, final PCM flush, microphone stop before finish, playback drain, muted completion and live capture. Source leak scan53 files0 matches. A later diff check reports one cosmetic extra blank line at EOF in the new backend test file; no runtime impact and no unsolicited repair applied. Initial desktop/mobile live preview fits. Commit2d74b99 secret-scanned (21 files/18 private values,0 matches), pushed/pulled; API/frontend/Nginx images built on staging and all22 server-runtime voice checks passed. Current release remains healthy/unchanged. Final browser interaction rerun awaits matcher correction consent; no live activation or paid speech check yet.

## Outcome

- Complete via owner standing all-changes deployment instruction prompt027: stage-git-047e4414086e-20261122174328 active. Actual staging frontend pointer/keyboard held speech, continuous live theme/audio/mobile fit and exit cleanup passed with synthetic audio;40 local backend/integration +4 frontend audio and22 server-runtime checks passed. Fresh fixture removed, no email/global-spend reset. Optional initial press question was unanswered; shipped stated hold/release behavior as part of owner's all-changes release. Prior mock matcher remains unrepaired; actual unmodified frontend/API tests supplied acceptance instead. Physical mic/Pixel/acoustic quality stays separate.
