# 2026-11-09 — AWS resource plan

## Prompt

> meanwhlie tell me what is your plan for AWS resources. what kind of services are you planning to use ?

## Questions and decisions

- User requested the current AWS resource plan while Phase 1 work continues.
- Explain currently defined resources separately from planned later phases.

## Actions

- Reviewed the SAM template and current AWS/Google documentation. Explained defined Phase 1 resources, later AWS services, Google Pub/Sub dependency, graph-store choice, and cost guard. Noted that some Bedrock India inference profiles can route Mumbai requests to Hyderabad and asked for the processing-location requirement.

## Files changed

- This prompt record, `notes/aws-resources.md`, `notes/ideas.md`, `README.md`, and `dairy.md`.

## Verification

- Cross-checked the current SAM template and primary AWS/Google documentation. No AWS resources deployed.

## Outcome

- Resource plan answered and recorded; Phase 1 work continues.
