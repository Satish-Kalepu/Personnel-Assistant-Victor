# Local sign-in origin rejection - 2026-11-22

## Prompt
it says "Request origin is not allowed."  when clicked sign in

## Questions and decisions
- Investigate the reported local sign-in failure read-only. Explain evidence/impact and ask for explicit repair consent before changing configuration or runtime.
- Inspect only public origin/port settings, not private credentials. Preserve ongoing unrelated work.

## Actions
- Read public settings only from the parent laptop env and running victor-api-1: APP_ORIGIN=http://localhost:8080, NODE_ENV=development. Frontend uses same-origin relative /api requests.
- Empty validation/sign-in requests from localhost pass origin enforcement; 127.0.0.1 and stage-domain origins reproduce the403 origin message. Correctly formed login from localhost with a random nonexistent synthetic account reaches401 INVALID_EMAIL_OR_PASSWORD.
- Asked which exact browser address the owner is using; no configuration or runtime repair attempted.

## Files changed
- This prompt entry and required factual records only; no repair authorized yet.

## Verification
- localhost empty sign-in400 validation / synthetic login401 credentials, versus127.0.0.1 origin403. No account created, email sent, real credentials used or user data queried.

## Outcome
- Allowed local origin works in API checks; browser address confirmation remains pending. Recommend opening the exact localhost URL. Any broader config/code repair requires diagnosis and explicit consent.
