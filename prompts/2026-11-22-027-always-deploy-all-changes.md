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

- AGENTS.md, default deploy CLI and staging runbooks; all current untracked/other-thread notes/guide/prompts committed as explicitly authorized; idea/task/debt/diary/verification records. Private env/runtime files excluded.

## Verification

- Full local40 backend/integration +4 frontend audio checks previously passed. New default CLI staged/scanned all21 changed files/18 private values0 matches, committed047e441, non-force pushed/exact pulled and activated stage-git-047e4414086e-20261122174328. All22 actual server-runtime voice checks/model/non-root mount/static acceptance passed.
- Public readiness/CSP/anonymous auth controls passed. Actual served app tested in a fresh authenticated browser context, using synthetic audio without intercepting application/API/voice modules: pointer held speech has no reply before release, microphone stops, correct156 answer; keyboard held speech returns142080 PCM bytes/peak22030 and stops capture; live returns134400 PCM bytes/peak22046, retains capture/theme, mobile fits and exit restores theme/stops capture. No JS runtime errors.
- Independent direct held-pause check passed with157440 PCM bytes/peak22093. Exact synthetic fixture removed and absence verified; no email/global-spend reset. Old local mocked script matcher remains unmodified. Browser runtime was reset to a sole about:blank context before final report retrieval; prior actual test results were captured and cleanup verified by inventory/account deletion.

## Outcome

- Complete for the standing policy/default workflow and deployment of all current work. New voice UI is live on staging. Existing private envs remain outside Git; latest source snapshot and deployment identified above. Post-release record publication follows without changing application code.
