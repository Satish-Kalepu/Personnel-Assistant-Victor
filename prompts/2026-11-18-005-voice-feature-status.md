# Voice feature status - 2026-11-18

## Prompt
Okay. app is working. where is voice feature ?

## Questions and decisions
- Owner reports the app is working. Record as user-reported success; individual Android acceptance checks remain unconfirmed.
- Voice was planned as a later build slice (TASK-005), not included in the current text-only APK.
- Recommend English push-to-talk and ordinary spoken replies next; automatic replies versus tap-to-speak remains an open interaction choice (IDEA-013 Discussing).

## Actions
- Reviewed MainActivity.kt, AndroidManifest.xml, and recorded voice/recording/task scope.
- Updated TASK-004 to reflect reported working app without claiming every acceptance check passed.
- Recorded the voice discussion and prepared a direct explanation of the missing implementation and the need for a rebuilt APK after a future voice update.

## Files changed
- prompts/2026-11-18-005-voice-feature-status.md
- notes/todo.md (TASK-004 reported progress)
- notes/ideas.md (IDEA-013 Discussing)
- dairy.md
- No application or AWS changes, repairs, packages, or external messages.

## Verification
- Current Android source has text input/Send and no speech capture/playback implementation. Manifest declares INTERNET only; voice task is Pending.
- No build, fresh AWS check, microphone/playback test, or device test performed. App-working report comes from the owner.

## Outcome
- Explain that voice is not yet implemented and propose the next interactive voice slice. Ask whether ordinary replies should speak automatically or only on a speaker-button tap; do not mark the voice task complete or all Android checks passed.
