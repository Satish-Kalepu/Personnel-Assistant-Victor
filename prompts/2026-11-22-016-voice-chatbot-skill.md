# Reusable voice chatbot architecture skill - 2026-11-22

## Prompt
give me a note on the current voice webrtc architecture .
I want to make another product's chatbot with this smooth voice integration.
so your note should have instructions on how to achieve/implement and what tools to choose. ( as a skill may be )
store it as "voice-chatbot-skill.md"

## Questions and decisions
- Create the exact requested root Markdown file as a standalone reusable skill-style implementation note, grounded in current source and primary provider/browser documentation.
- Current implementation is WSS/PCM. Owner steering in prompt017 explicitly excludes alternatives and asks for only what is implemented. Distinguish current source, documented staging evidence and real-device acceptance gaps.
- Apply skill-creator guidance; do not install a global skill or modify/deploy application code. Preserve existing uncommitted work and private configuration.

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
