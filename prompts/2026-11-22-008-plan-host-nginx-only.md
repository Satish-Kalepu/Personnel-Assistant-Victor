# Plan host Nginx without web-container Nginx — 2026-11-22

## Prompt

instead of having nginx in **Web-container Nginx**  .  ask me what to put on global nginx settings. . i guess that solves everything?

## Questions and decisions

- Owner proposes removing container Nginx and using the existing host Nginx, with agent-supplied settings for owner application.
- Prepare a concrete site-scoped configuration and migration plan. Clarify this removes one serving layer but still requires host-readable immutable assets, loopback API exposure and release/rollback integration.
- No host edit/reload or immediate container removal inferred before replacement routes/config are reviewed and applied. Preserve other sites/global defaults and current healthy release.

## Actions

- Inspected current routes/security headers/Compose/API server and actual host: Nginx1.22.1 user nginx995/group993, /srv0755 root-owned, proposed public root absent and port18081 unused. ss unavailable, used existing netstat without installing tools. Current public headers include CSP/microphone-self and no HSTS observed.
- Prepared site-only host fragment, syntax harness and ordered migration/runbook with scoped one-time directory command, Git/staging asset publication, loopback API preparation, owner edit/test/reload, public acceptance and retirement/rollback gates. No global config replacement or private-home permission changes proposed.

## Files changed

- This prompt; deploy/nginx/ai_test.host-only.conf, host-only.syntax.conf; docs/host-nginx-migration.md; IDEA-020/TASK-021 and diary. No runtime change.

## Verification

- Eight-file Git index/18-private-value scan and whitespace checks passed. Proposal c154202 non-force pushed/fast-forward pulled. Actual host Nginx1.22.1 passed isolated syntax-only validation with the Git-pulled fragment and app-owned logs, no sudo/reload. Static root/API readiness and real merged TLS config remain unverified until migration preparation/owner step.

## Outcome

- Concrete site-only settings and ordered migration/sudo instructions prepared and syntax verified. Host-only removes duplicate serving layer but does not automatically solve file permissions or publishing/API readiness. Requested owner choice to proceed with Git-based migration preparation or review settings only. IDEA-020 remains Discussing; no runtime/host change, current working app preserved.
