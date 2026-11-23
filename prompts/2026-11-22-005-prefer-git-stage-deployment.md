# Prefer Git deployment and scoped sudo — 2026-11-22

## Prompt

instead of copying data to stage environment, ask for sudo privileges when required and use git push pull for code deployment.

## Questions and decisions

- Explicit instruction: use Git push/pull for staging code deployment instead of copying application artifacts/data from the workstation; build images on staging. Request scoped sudo privileges when genuinely required rather than working around a privileged operation through copying.
- Preserve staging runtime data and private env outside Git. No permission inferred to migrate databases, expose secrets or change unrelated host configuration.

## Actions

- Inspected local/server Stage checkouts (same clean base commit; approved implementation/records uncommitted locally), remote capacity and existing app-user Git/Docker permissions. Current path needs no sudo.
- Persisted owner policy in AGENTS/runbook, added push/exact-pull/server-builder entry point, retired workstation image/env upload modes. Server builder preserves owned voice mode, prepares public model locally on staging, handles private checkout/non-root build ownership, runs voice/worker smoke checks before switching only app containers.
- Reviewed current approved code/research/records for a curated Git commit. Local/remote Stage were not diverged; helper JS/Bash syntax and provider-value source checks passed. Index scan, commit/push and actual server build/release remain pending.
- Exact129-file index checked against18 private values: no secret/private-path matches; whitespace passed. Committed f8d58dc, pushed Stage without force, server fast-forward pulled the exact commit. All three images built on staging;18 voice tests and non-root worker smoke passed.
- Git-built web startup failed. Automatic rollback restored stage-owned-4becaff17ef6 and all app containers healthy, DB uptime retained. Read-only diagnosis found root-owned mode600 Nginx image template unreadable to UID101. Proposed COPY ownership/readability preflight repair and requested explicit AGENTS consent; no web repair applied while pending. No host sudo or workstation artifact/env upload used.
- Prompt006 explicitly approved template-only ownership/readability correction. Commit c06a61a pushed/pulled, all three server builds/18 voice checks/non-root smoke/container health passed. Final public-file audit found the separate microphone worklet unreadable/HTTP403. Proposed assigning all built public assets to Nginx and recursive readability preflight; separate approval pending. Restored the previous release under rollback procedure; readiness/worklet200 and anonymous profile401 verified. Runtime config/data stayed on staging throughout. Current code is committed/pushed; final acceptance waits for scoped source repair consent.

## Files changed

- AGENTS.md; deployment CLI/runbook/server builder and retired upload helpers; worker build ownership; linked IDEA-019/TASK-021/diary/stage docs. Current previously approved app/voice research changes will be published in the reviewed commit; private env/models/venv/operator state excluded.

## Verification

- JS/Bash syntax passed; provider-value source scan found no matches; private model/cache/operator examples confirmed ignored. Stage checkout clean and about2.1GiB available memory/10GiB disk, existing app healthy. Actual Git release/index checks pending.
-129-file exact index scan against18 private values passed with zero matches/private paths. Git commits f8d58dc/c06a61a non-force pushed and exact fast-forward pulled. Server built all images,18 voice tests and non-root web/worker smoke passed. First automatic rollback and later post-asset-acceptance rollback verified. Final current release stage-owned-4becaff17ef6 healthy; public readiness200, worklet200, anonymous401. No user database migration/read, private-env upload, sudo or unrelated host change.

## Outcome

- Git deployment policy/entry point implemented, reviewed code committed and non-force pushed/pulled, staging-side builds and18 voice/runtime checks demonstrated. Template-only image defect repaired after prompt006 approval. Final browser voice acceptance found a separate public worklet ownership defect; broader repair consent pending. Previous healthy release restored and checked. TASK-021 remains In progress until public-asset acceptance; default Git/scoped-sudo policy is active. No sudo or workstation artifact/env transfer used.
