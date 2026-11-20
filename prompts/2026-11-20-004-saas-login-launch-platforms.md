# SaaS login, launch and platforms - 2026-11-20

## Prompt
Reply to: How should users sign in? All options include email verification at registration and email-based password recovery.
Answer: Password login; email OTP only for registration and recovery

Reply to: How should the first SaaS release accept users?
Answer: Public free registration with usage limits

Reply to: Should the existing Android app be updated alongside the web app for the new authentication and API?
Answer: Web and Android together (Recommended)

## Questions and decisions
- Password login; email OTP for registration and recovery, not every login.
- Public free signup with enforced usage limits; no launch subscription/payment integration selected.
- Update web and Android together. Existing friend-built Pixel 8a Android 16+ arrangement continues.
- Plan-first boundary remains: no application builds, AWS deletion or data changes during review.

## Actions
- Incorporated choices into the proposed plan, acceptance criteria, IDEA-015, TASK-014 through TASK-017, scope and diary.

## Files changed
- This prompt entry and linked planning records; no runtime, build or AWS changes.

## Verification
- No runtime tests, builds or resource changes for these replies.

## Outcome
- Login, initial access model and client scope explicitly chosen and recorded. Concrete architecture and sequence prepared for review; no implementation started.
