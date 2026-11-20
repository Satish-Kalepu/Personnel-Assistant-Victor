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
- Record supplied stage target; inspect repository instructions, pending deployment/restore source and SSH access configuration.

## Files changed
- This prompt entry. Implementation/deployment updates will be recorded as made.

## Verification
- Stage access and current repository state checks pending. No stage changes yet.

## Outcome
- In progress.
