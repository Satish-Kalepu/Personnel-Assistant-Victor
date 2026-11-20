# Approve Sarvam speech - 2026-11-19

## Prompt
I confirm  Sarvam is India's . we can use it

## Questions and decisions
- Owner explicitly authorized Sarvam after reaffirming Mumbai-only earlier today. Treat this as permission to use Sarvam for speech, while preserving Mumbai Bedrock reasoning/memory and making clear that an Indian company or hosted endpoint is not a verified Mumbai-only guarantee.
- Inspect JS/Flutter SDKs and choose a secure integration path; do not expose the service API key in web or Android clients.
- No provider purchase or deployment performed.

## Actions
- Update the ongoing voice research and provider decision. Review SDK authentication and streaming support.

## Files changed
- This prompt entry; ongoing source and record changes tracked in the parent voice prompt.

## Verification
- 20 backend tests, 11 gateway tests, web checks, SAM/Docker packaging and synthetic provider test pass. Zero-retention confirmation, host decision/deployment and native validation remain.

## Outcome
- Sarvam speech selected and implemented in source under IDEA-013/TASK-013. This authorizes Sarvam speech without claiming its hosted API is Mumbai-only; Mumbai reasoning/memory preserved.
- Continued with the parent voice task across 2026-11-19/20; see [main work record](2026-11-19-001-smooth-voice-research.md) and dairy.md for shared changes.
