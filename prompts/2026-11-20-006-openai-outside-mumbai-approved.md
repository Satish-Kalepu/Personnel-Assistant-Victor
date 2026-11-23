# OpenAI reasoning outside Mumbai approved - 2026-11-20

## Prompt
Reply to: Should OpenAI replace Bedrock for chat and memory while Sarvam continues speech? Your earlier rule required Mumbai processing, and an ordinary API key does not establish that location.
Answer: Use OpenAI + Sarvam; allow processing outside Mumbai

## Questions and decisions
- Explicitly select OpenAI API for chat and memory, retain Sarvam for speech, and permit processing outside Mumbai.
- Supersedes the earlier Mumbai-only reasoning constraint for this replacement. Keep prior decisions as history.
- API model and account data-control configuration will be checked during implementation; no guarantee of Mumbai or zero-retention OpenAI processing is inferred.
- Full Docker/backend/auth architecture remains proposed for plan review; no resource deletion in this planning step.

## Actions
- Update migration plan, idea/task/scope records and diary with the confirmed provider/location choice.

## Files changed
- This prompt entry and related planning/record files; no runtime files.

## Verification
- Official API onboarding, billing, key-safety and data-control documentation checked in the preceding planning work. No API call, key read/storage, runtime test, build, host login or cloud mutation.
- Final documentation checks passed: six new documents checked for whitespace, all five answer/planning prompt entries contain required sections, new idea/task headings unique and new idea links resolve. Tracked-record diff whitespace check passed with line-ending normalization warnings only.

## Outcome
- Provider/location question resolved and recorded in the detailed plan, IDEA-015, TASK-014/015, scope and diary. Full architecture remains proposed for owner review; no implementation or deletion performed.
