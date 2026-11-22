# Architecture overview ? 2026-11-22

## Prompt

okay give me architecture overview now.

## Questions and decisions

- Explain the owner-selected IDEA-021 architecture, including UI/transport, authoritative backend/agent, private speech worker, persistence/providers and mounted frontend release path.
- Distinguish locally verified new configuration from the existing staging runtime. This question does not authorize missing scoped sudo or add a new agent-loop design.

## Actions

- Prepared a concise architecture diagram and current rollout status based on the implemented configuration and inspected staging state.

## Files changed

- This prompt and diary/verification records; no additional architecture or runtime change from the overview request.

## Verification

- Reused completed frontend/Nginx builds,10 isolated route/security groups,18 voice regressions, final Nginx check-only startup, expected unreadable-worklet rejection/readable-worklet acceptance, and retained no-build release dry-run. No new tests required for this explanation.

## Outcome

- Overview supplied for the selected container-Nginx/mounted-frontend architecture. New configuration locally verified; Git publication and privileged staging directory setup remain separate rollout steps. Existing staging stays healthy and unchanged.
