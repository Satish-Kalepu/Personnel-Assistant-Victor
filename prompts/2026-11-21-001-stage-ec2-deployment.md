# Stage EC2 deployment - 2026-11-21

## Prompt
Here is the stage server  ( aws ec2 instance ) which you should host this service and run .&#x20;
ssh:  ai_assistant@65.2.130.74

## Questions and decisions
- Owner explicitly supplies and authorizes the stage EC2 destination ai_assistant@65.2.130.74 for hosting/running this service.
- Continue the approved Docker/MongoDB SaaS objective; inspect host identity, access, capacity and existing workloads before mutations. Do not disrupt unrelated services or infer a domain/ALB configuration.
- Prior state: local images/builds, 27 tests, browser registration/login/live chat and synthetic voice passed. Cold restore correction remains unverified; no old AWS resources have been deleted.
- A previous escalated cold-restore command was not executed because automatic approval review hit a usage limit; do not bypass that check. Resolve access/review availability through normal approval paths.

## Actions
- Renewed SSO and verified exact EC2 metadata; owner confirmed SSH key in prompt 003. Inspected workload/capacity and available privileges. Installed checksum-verified Compose only in app-owned directory.
- Transferred/verified five images across Docker 29/25 using common API 1.44 layer/runtime fingerprints; deployed dedicated loopback-only project with restrictive private env permissions. Existing services, native databases and security groups preserved.
- Cold MongoDB restore/restart and old AWS retirement completed/independently verified. Opened private preview tunnel, verified actual stage registration/OTP/chat/synthetic voice, removed exact fixture, and cloned GitHub Stage via linked key. Owner explicitly declined old MongoDB rule repair (prompt 004).

## Files changed
- Deployment/Git/tunnel/verification helpers, stage/operations/retirement docs, notes/tasks/debt, diary and prompts 001-005. Ignored private stage settings/trust/image manifests; no credentials in Git.

## Verification
- Five runtime services healthy; DB setup exited 0; app/mail loopback-only, new DB ports unpublished. Anonymous null session/private-data 401/web/CSP checks passed. Stage registration/OTP/recovery enrollment/chat and synthetic voice passed (918ms transcript, 2575ms first audio); fixture removal checked.
- Local 27 tests and cold restore/restart passed; old cloud resources independently absent and supplied EC2 still running. Existing workload metadata unchanged. AL2/unencrypted disk/disabled Docker boot documented, not repaired. Android/real mic/SES/public routing unverified.

## Outcome
- Requested service is running privately on supplied EC2, accessible through operator SSH tunnel. Await owner domain/ALB details for public HTTPS; production/device acceptance remains open.
