# SaaS limits, SES and OpenAI intent - 2026-11-20

## Prompt
Reply to: For the free launch, may I start with 20 chat turns and 5 voice minutes per verified user per day, one active voice session per user, plus an application-wide $50/month AI budget guard? These are configurable usage limits; provider billing can lag the guard.
Answer: Use these initial limits (Recommended)

Reply to: Which email delivery service should production use for verification and recovery? Local development will use a mail viewer without sending real emails.
Answer: Amazon SES SMTP in Mumbai (Recommended)

Reply to: Should we keep the approved AI providers while replacing the hosting and database?
Answer: I will give chatgpt key

## Questions and decisions
- Approved initial limits: 20 chat turns and 5 voice minutes per verified user per day; one active voice session per user; $50/month application-wide AI guard, subject to provider billing lag.
- Selected Amazon SES SMTP in Mumbai for production; Mailpit remains development-only.
- Owner intends to supply a ChatGPT key. Clarify this means an OpenAI API key, not a ChatGPT subscription credential, and resolve the earlier Mumbai-only reasoning constraint before adoption.
- Do not request, print or record any actual key. No AI provider change or call authorized during the planning review.

## Actions
- Read the OpenAI onboarding skill, checked official key/billing/data-control documentation, and updated the plan. Asked provider/location clarification; prompt 006 explicitly selects OpenAI reasoning plus Sarvam speech and allows processing outside Mumbai.

## Files changed
- This prompt entry and linked plan/idea/task/debt/scope/diary records; no runtime or AWS changes.

## Verification
- No OpenAI call, key storage, build, data deletion or cloud mutation performed.

## Outcome
- Limits and SMTP finalized; OpenAI/location clarified and approved in prompt 006. Full architecture and sequence prepared for review.
