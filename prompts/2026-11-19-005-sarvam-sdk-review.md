# Voice work follow-up - 2026-11-19

## Prompt
sarvam has  javascript/flutter SDKs.  for  STT and TTS . have a look at the sdk and apis documentation whether that makes our life easier.

## Questions and decisions
- Review Sarvam JavaScript/Flutter SDK and API documentation before continuing provider-specific work; strict Mumbai-only processing remains in force.

## Actions
- Continue the original Android/web smooth-voice task; investigate the requested follow-up.

## Files changed
- This prompt entry; remaining records will be updated with the ongoing work.

## Verification
- 11 gateway tests including SDK handshake/auth/serialization passed. One short real synthetic STT/TTS test passed; no personal audio used. Native/client deployment still pending.

## Outcome
- Reviewed official JS/Flutter APIs and inspected installed sarvamai 1.1.20. Chose JS server SDK for Model APIs and retained Kotlin; Flutter SDK is for hosted Voice Agents. See research and gateway source.
- Continued with the parent voice task across 2026-11-19/20; see [main work record](2026-11-19-001-smooth-voice-research.md) and dairy.md for shared changes.
