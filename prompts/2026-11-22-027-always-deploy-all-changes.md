# Always publish and deploy current workspace changes ? 2026-11-22

## Prompt

always deploy all changes to stage environment by pushing and committing local changes irrespective of untracked or other thread chagnes.  and pull on stage environment.  keep not of it

## Questions and decisions

- Explicit standing authorization includes all current non-ignored repository changes, including untracked files and work from other threads. Persist it in AGENTS.md and release tooling; stop excluding such files based on ownership.
- Preserve the existing private-env/credential/runtime exclusions and non-force Git workflow. This instruction authorizes deployment of the prepared voice feature, not an automatic repair of the separately pending browser-mock matcher.
- Validate the actual staged source and actual staging UI/provider paths; keep rollback/database/env protections.

## Actions

- Update standing agreement, default commit/push/pull/deploy workflow and decision records; deploy all current safe repository changes.

## Files changed

- Pending agreement/tooling/records updates; all existing safe untracked changes are authorized for this release.

## Verification

- Prior voice feature:40 isolated backend/integration and4 frontend audio tests passed; server-built feature images passed22 voice checks. Current release activation pending.

## Outcome

- In progress.
