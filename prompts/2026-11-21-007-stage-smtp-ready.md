# Stage SMTP ready - 2026-11-21

## Prompt
I have provided smtp credentials in .env.stage

## Questions and decisions
- Owner provides SMTP settings in the private ignored stage env during the scoped HTTPS deployment discussion. Use them for the requested stage service, without displaying or committing credentials.
- Validate settings and SMTP connectivity before deploying production-mode HTTPS. Keep the existing host proxy and unrelated services unchanged; prepare exact administrator instructions for the domain block.

## Actions
- Inspecting allowlisted nonsecret settings and credential presence; SMTP check pending.

## Files changed
- This prompt entry and deployment records as work progresses. Private env changes will never be committed.

## Verification
- Pending; no SMTP credentials displayed.

## Outcome
- SMTP supplied; HTTPS stage configuration continues.

## Follow-up verification and outcome
- Owner supplied SMTP in ignored .env.stage and requested manual proxy editing. Production-mode app now trusts https://ai_test.satishk.com, enables Secure cookies and uses authenticated TLS SMTP; prior origin rejection resolved. Database/auth secrets and image versions preserved. No host Nginx/security-group/native database changes.
- Laptop and EC2 SMTP TLS/authentication passed without sending email. Public HTTPS ready/null-session/401/CSP and domain-origin field-validation400 passed. Credential values never displayed or committed.
- Exact domain-only blocks: deploy/nginx/ai_test.locations.conf; instructions: docs/stage-nginx.md. Isolated check with host Nginx binary passed; actual full-config syntax/reload and voice handshake await manual application. Actual inbox delivery, suppression and Pixel/browser quality remain unverified.
- Files changed: HTTPS operator helper, proxy proposal, stage/Android/README/idea/task/debt/diary/prompt records; private env synchronized outside Git. Two helper preflight quoting errors stopped before mutation, were corrected, then deployment succeeded. No extra application-source repair was needed.
