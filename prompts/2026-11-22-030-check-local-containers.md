# Check local containers - 2026-11-22

## Prompt
seems containers not running locally. check

## Questions and decisions
- Check only this application's local Compose/container health and HTTP endpoints. Do not start/restart or repair services without explicit consent if a defect is found.
- Read only public settings; preserve other projects and ongoing work.

## Actions
- Inspected only Victor Compose containers and public local settings. MongoDB/Redis are running healthy; setup exited0 as expected; API/web containers are absent and Mailpit exited255.
- Local app/readiness/session/mail ports refuse connections. Validated selected Compose services without printing credentials.
- Parent local env lacks WEB_ASSET_PATH and COMPOSE_PROFILES; default published frontend directory is absent. Existing web/dist index/worklet are present. SMTP is configured for a non-Mailpit host; no credentials displayed.
- Proposed repair for owner consent: preserve a private backup/settings/data/provider keys, set laptop frontend mount and local-mail profile/SMTP, then build/start the dedicated local stack and verify readiness/sign-in/OTP capture. No repair executed.

## Files changed
- This prompt entry and required diary record only.

## Verification
- Read-only Docker/API checks confirm missing app ingress/API, stopped mail viewer and healthy databases. Compose validation selects API/web/data services but no local-mail profile; default frontend mount missing.

## Outcome
- Local application is currently down. Explicit consent is needed before restoring configuration and starting/building services under AGENTS.md Repairs require consent. No runtime/config/data changes performed.
