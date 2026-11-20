# SaaS foundation decisions - 2026-11-20

## Prompt
Reply to: What should happen to the existing chats and personal memory before the old AWS resources are deleted?
Answer: Permanently delete them

Reply to: Security-question answers are often guessable—and may already be in a personal assistant’s memory. Can we replace them with verified-email recovery and recovery codes?
Answer: Replace security questions (Recommended)

Reply to: For the first SaaS release, should every account be a completely private personal space, or should users share team/workspace data?
Answer: Private personal accounts only (Recommended)

## Questions and decisions
- Explicitly approved fresh start with permanent old-chat/memory deletion, replacement of security questions, and private personal accounts only.
- These choices refine the active plan-first request in 2026-11-20-002; no deletion during the planning review.
- Login OTP frequency, first-release access policy and Android timing questions sent next.

## Actions
- Incorporated answers into docs/docker-mongodb-saas-plan.md, IDEA-015, TASK-014 through TASK-017, scope and diary. No deletion performed.

## Files changed
- This prompt entry and the linked plan/idea/task/debt/scope/diary records; no runtime or AWS changes.

## Verification
- No runtime tests or data/resource changes performed for these answers.

## Outcome
- Explicit choices recorded in the complete proposed plan. Subsequent answers 004-006 resolve login, launch, limits, SMTP and providers; full architecture awaits review.
