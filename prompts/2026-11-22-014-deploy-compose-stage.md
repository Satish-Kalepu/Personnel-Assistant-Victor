# Deploy simplified Compose to staging — 2026-11-22

## Prompt

go ahead and update stage environment.

## Questions and decisions

- Owner explicitly authorizes staging rollout of IDEA-021 / TASK-022 using Git push/pull and server-side builds.
- Preserve existing databases, private configuration, host TLS and unrelated services; retain rollback versions.
- Recheck the dedicated public root. Request scoped sudo only if creation still requires elevated access, as required by AGENTS.md.

## Actions

- Reviewed prepared source and prior local verification. Read-only staging check confirms current app healthy, clean checkout5de74d5, existing API/web/worker and databases healthy,9.6GiB free. /srv/victor-web is still absent and passwordless sudo is unavailable. Publish reviewed code through Git before requesting the scoped one-time directory setup; no live runtime change yet.

## Files changed

- This prompt and deployment/task/diary/evidence records; prepared implementation remains from prompt010.

## Verification

- Reviewed source committed as a7df321, non-force pushed and fast-forward pulled on staging. Index scan31 files /18 private values: zero matches. All four images built on staging; pinned model checksum,18 isolated voice regressions and non-root worker/model smoke passed. No live rollout yet; directory setup pending. Evidence saved under research/voice-chatbot-2026-11-21/evidence-compose-stage-preflight-2026-11-22.json.

## Outcome

- Completed through prompt015 after owner cancelled /srv/sudo and selected checkout-local publication. Commitf2f0646 deployed as stage-git-f2f0646806e4-20261122111218; static/auth and authenticated synthetic voice acceptance passed, fixture removed. Original MongoDB/Redis containers, private config location and host TLS preserved. No sudo or /srv creation. See prompt015 and release evidence for details.
