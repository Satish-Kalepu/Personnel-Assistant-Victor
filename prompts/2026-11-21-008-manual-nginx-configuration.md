# Manual Nginx configuration - 2026-11-21

## Prompt
give me nginx configuration , i will udpate manually

## Questions and decisions
- Owner requests exact Nginx configuration and will apply it manually. Limit proposed changes to the ai_test.satishk.com TLS server block; preserve certificates and all other sites/listeners.
- Provide WebSocket upgrade, trusted client-IP forwarding and syntax-check/reload instructions. Do not edit/reload host Nginx automatically.

## Actions
- Prepared copyable location blocks and an operator reference; app HTTPS/SMTP configuration and checks completed independently.

## Files changed
- This prompt entry and deployment documentation. No host configuration changed.

## Verification
- Proposed fragment passed isolated host-binary syntax check. HTTPS app origin now works and SMTP TLS/authentication passed from EC2. Full actual host config validation/reload and voice handshake remain pending manual application.

## Outcome
- Copyable Nginx proposal ready and pushed/pulled on Stage. Host config not edited or reloaded by the agent.

## Follow-up verification and outcome
- Owner supplied SMTP in ignored .env.stage and requested manual proxy editing. Production-mode app now trusts https://ai_test.satishk.com, enables Secure cookies and uses authenticated TLS SMTP; prior origin rejection resolved. Database/auth secrets and image versions preserved. No host Nginx/security-group/native database changes.
- Laptop and EC2 SMTP TLS/authentication passed without sending email. Public HTTPS ready/null-session/401/CSP and domain-origin field-validation400 passed. Credential values never displayed or committed.
- Exact domain-only blocks: deploy/nginx/ai_test.locations.conf; instructions: docs/stage-nginx.md. Isolated check with host Nginx binary passed; actual full-config syntax/reload and voice handshake await manual application. Actual inbox delivery, suppression and Pixel/browser quality remain unverified.
- Files changed: HTTPS operator helper, proxy proposal, stage/Android/README/idea/task/debt/diary/prompt records; private env synchronized outside Git. Two helper preflight quoting errors stopped before mutation, were corrected, then deployment succeeded. No extra application-source repair was needed.
