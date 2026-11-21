# Approve Git-built web image ownership repair — 2026-11-22

## Prompt

Reply to: May I give the web image’s Nginx template to its existing `nginx` user, add a pre-deployment readability check, then commit/push/pull and rebuild on staging? The file is currently root-owned mode 600 and unreadable to Nginx (UID 101). The previous release is healthy after automatic rollback. AGENTS.md’s “Repairs require consent” rule requires approval for this newly diagnosed defect; no host sudo is needed.

Approve image ownership fix and Git redeploy

## Questions and decisions

- Explicit consent covers the diagnosed web image template ownership and a pre-switch readability smoke check, followed by Git commit/push/pull/server rebuild/redeploy. Keep the configured non-root runtime, private host modes and unrelated services unchanged.

## Actions

- Apply COPY ownership for the existing Nginx runtime user; verify public template/index readability before changing the selected release.

## Files changed

- This prompt; web/Dockerfile and deploy/scripts/deploy-stage-from-git.sh; linked deployment/evidence/diary records.

## Verification

- Pending syntax/index checks and actual Git-built image/runtime verification. Prior failed image and successful automatic rollback are recorded separately.

## Outcome

- In progress.
