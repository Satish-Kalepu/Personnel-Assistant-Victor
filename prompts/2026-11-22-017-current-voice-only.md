# Current voice implementation only - 2026-11-22

## Prompt
ignore webrtc. just put what we have now

## Questions and decisions
- Steering for prompt016: owner explicitly limits voice-chatbot-skill.md to the current implemented architecture. Exclude alternative transports/provider migrations and speculative architecture recommendations.
- Explain current WSS/PCM, owned Silero endpointing, Sarvam STT/TTS, queued backend model/memory processing and browser/Android adapters. Preserve evidence limits and actionable porting caveats.

## Actions
- Inspected actual web/native audio, owned worker/VAD, STT/TTS adapters, repaired input queue, model/persistence/auth/limits and current Compose/Git workflow. Checked primary speech/browser/model documentation.
- Created requested root voice-chatbot-skill.md with reusable skill frontmatter, current-stack diagram/tool choices, protocol/settings, input/output lifetime rules, porting instructions, deployment boundaries, validation cases and20 source/evidence links. Alternatives omitted per prompt017.
- Recorded reuse idea as IDEA-022 Discussing; documented existing Android mute field mismatch/impact and separate proposed repair under DEBT-012 without changing application code.

## Files changed
- voice-chatbot-skill.md; this prompt entry and its linked prompt016/017; notes/ideas.md; notes/tech-debt.md; dairy.md. Existing concurrent changes preserved. Private ignored validation copy only; no installed skill or runtime/config repair.

## Verification
-20 local references resolve; frontmatter/name/description/scaffold and code-fence checks pass.21 configured secret values scanned,0 matches; no values displayed. Final whitespace checks performed separately.
- Bundled quick_validate.py could not run because PyYAML is absent. Performed bounded metadata checks instead; no dependency install or false full-validator success claim.
- Source/report review only: no application tests, live regression, provider calls, email, microphone or deployment performed. Historical synthetic timings/device gaps explicitly separated from current claims.

## Outcome
- Requested current-implementation note saved as voice-chatbot-skill.md and ready to reuse as documentation or copy into a SKILL.md folder. New product implementation remains a separate decision; no app repair/deployment authorized or performed here.
