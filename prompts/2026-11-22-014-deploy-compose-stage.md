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

- Prior local verification:10 routing/security groups,18 voice regressions, frontend/Nginx builds, mount permission preflight and retained no-build release plan passed. Remote rollout pending.

## Outcome

- Preparing reviewed Git publication. Deployment is authorized but public-root setup needs owner-scoped sudo before the mount can be used.
