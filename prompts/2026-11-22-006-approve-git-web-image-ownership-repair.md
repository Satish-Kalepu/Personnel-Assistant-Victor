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

- Commit c06a61a pushed/pulled and built on staging.18 voice tests, non-root template/index readability and worker smoke passed; container health passed. Final static audit found the separate microphone worklet root-owned mode600/unreadable; public worklet403 while root/health200. Proposed a broader built-public-asset ownership/readability check and requested separate explicit consent; not applied while pending. Prior failed image and rollback evidence retained.

## Outcome

- Approved template-only repair verified; browser-voice acceptance is blocked by the separately diagnosed public worklet ownership. Broader repair consent pending under parent prompt005/TASK-021.
