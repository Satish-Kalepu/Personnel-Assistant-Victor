# Keep published frontend inside designated checkout — 2026-11-22

## Prompt

wait. lets not do it.  it cannot create a  /srv/ folder in server root.  it should be in the codebase/repo location designated to it

## Questions and decisions

- Explicit owner steering cancels /srv directory creation and the pending sudo setup request. Retain container Nginx and Git deployment.
- Publish public build output under repository/deploy/.local/web/releases, select repository/deploy/.local/web/current, and mount only that public subtree read-only. This existing ignored app-owned location keeps private checkout/env/data unserved.
- Update the selected source path, related configuration/tests/runbooks and deploy through Git. No root-directory creation or privileged host change is authorized/needed for this path.

## Actions

- Replaced /srv source/precondition with guarded app-owned checkout/deploy/.local/web release/current publication. Verified canonical app-owned checkout and preserved private parent modes.
- Committed f2f0646, non-force pushed and fast-forward pulled that exact commit. Default CLI correctly stopped at unrelated untracked prompt files from concurrent work; left them untouched and executed the same server-side Git release builder for only the reviewed SHA.
- Built all four images on staging;18 voice checks, worker/model and non-root mounted-asset/config preflight passed. Activated stage-git-f2f0646806e4-20261122111218; index/worklet/referenced asset responses passed.
- Public HTTPS readiness/session/private-route/CSP checks passed. Fresh authenticated synthetic voice produced correct156 reply and nonzero audio; exact fixture removed with no email/global-spend reset. Prior historical audio evidence preserved; new evidence recorded separately.
- Verified actual mount read-only, frontend files0644, checkout/deploy parents0700, all app containers healthy and original MongoDB/Redis IDs/start times unchanged. No /srv path, sudo, host TLS edit or workstation env/data transfer.

## Files changed

- docker-compose.yml, .env.example, README.md, deployment/check scripts and current runbooks; idea/task/debt/diary/prompt records. No private env or user data changed locally.

## Verification

- All10 local routing/security groups, server Bash/JS/Compose checks,18 exact server-runtime voice regressions and non-root worker/mounted-asset checks passed. Public static/auth readiness and authenticated synthetic STT/LLM/TTS passed (161280 PCM bytes, peak27374); synthetic fixture removal verified. MongoDB/Redis identities and parent permissions preserved. Evidence: evidence-compose-stage-release-2026-11-22.json and evidence-compose-stage-voice-2026-11-22.json under research/voice-chatbot-2026-11-21. Physical microphone/Pixel and deliberate rollback drill remain separate follow-ups.

## Outcome

- Complete for the authorized staging rollout. https://ai_test.satishk.com runs stage-git-f2f0646806e4-20261122111218 with repository-local read-only frontend publication; /srv/sudo request cancelled and unused. TASK-021/022 completed for their stated scope. Unrelated concurrent prompt files left untouched.
