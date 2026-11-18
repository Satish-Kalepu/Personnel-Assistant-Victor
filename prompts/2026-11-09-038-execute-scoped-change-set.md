# 2026-11-09 — Execute scoped Phase 1 change set

## Prompt

> Yes, execute revised change set (Recommended)

## Questions and decisions

- Owner explicitly approved executing the reviewed `victor-phase1` change set `samcli-deploy1794232742` in `ap-south-1` with the scoped Lambda role and 15 planned additions.
- If deployment fails, investigate read-only and seek consent before repairing defects, per `AGENTS.md`.

## Actions

- Rechecked the approved change set, SSO session, and Mumbai Region, then executed `samcli-deploy1794232742`.
- Monitored CloudFormation through `CREATE_COMPLETE`. Verified all 15 resource statuses, scoped Lambda role, direct Mumbai model setting, JWT authorization on five API routes, DynamoDB point-in-time recovery, 14-day logs, active Cognito domain, and three $50 budget notifications.
- Sent unauthenticated synthetic GET and POST API requests; both returned 401.
- Directly invoked the ARM64 Lambda with separate synthetic Practice and Personal messages. Both returned 200, each stored two messages, and only Personal stored one fact. Removed the six generated test records.
- Filled git-ignored `android/victor.properties` from public stack outputs and prepared `docs/android-build-handoff.md` for the later Android Studio build.

## Files changed

- `README.md`, `backend/README.md`, `aws-requirement.md`, `notes/aws-resources.md`, `notes/deployment-review.md`, `notes/todo.md`, `notes/tech-debt.md`, `docs/android-build-handoff.md`, this prompt record, and `dairy.md`. Git-ignored `android/victor.properties` was also written locally.

## Verification

- Stack status and all 15 resources are `CREATE_COMPLETE`. Lambda role/model, JWT routes, PITR, log retention, budget limit and notifications, and Cognito domain passed live read-only checks. Unauthenticated API checks returned 401; direct synthetic Lambda tests passed. Android end-to-end testing remains pending.

## Outcome

- Approved Phase 1 backend deployed and smoke-checked in Mumbai. No Android build or authenticated API test yet; Cognito first sign-in remains to be confirmed.
