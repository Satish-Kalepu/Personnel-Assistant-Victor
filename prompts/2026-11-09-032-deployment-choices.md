# 2026-11-09 — Phase 1 deployment choices

## Prompt

> Use Ministral 14B (Recommended)
>
> Generate one (Recommended)
>
> Yes, set 14 days (Recommended)
>
> AWS account email (Recommended)

## Questions and decisions

- Owner selected the available direct Mumbai Ministral 14B model for the Phase 1 proposal.
- Owner authorized generation of a unique Victor-specific Cognito domain prefix.
- Owner explicitly approved the 14-day CloudWatch log-retention repair after the default indefinite retention was explained.
- Owner chose the AWS account email for $50 AWS Budgets notifications.

## Actions

- Added a named 14-day Lambda log group and $50 account-wide AWS Budget with actual and forecast email alerts to the SAM template.
- Generated `victor-private-78d0389e91`; a read-only Cognito lookup found it unclaimed at check time. Confirmed the SSO profile can read the AWS account email without printing it.
- Initial SAM lint found the new Budget had `DeletionPolicy: Retain` without matching `UpdateReplacePolicy`. Explained the risk and requested explicit consent; repair and verification are recorded in prompt 033.
- Ran synthetic direct Mumbai model checks. English Practice produced a useful correction. Personal mode returned Markdown-fenced JSON that the current parser rejects; explained the impact and requested consent for a narrow parser repair.
- Read-only CloudFormation checks found no existing Victor stack or SAM-managed artifact-bucket stack in Mumbai; noted that change-set preparation will create a support bucket and upload artifacts.

## Files changed

- `backend/template.yaml`, `notes/ideas.md`, `notes/aws-resources.md`, `notes/deployment-review.md`, `notes/todo.md`, `notes/tech-debt.md`, `aws-requirement.md`, this prompt record, and `dairy.md`.

## Verification

- After the approved Budget replacement-protection repair, SAM lint and local build passed on the updated template. Cognito lookup returned no domain. Direct model checks succeeded with synthetic data; personal JSON formatting exposed a parser compatibility defect.

## Outcome

- Parameters and cost controls are prepared in source, not deployed. Parser repair consent and final change-set review remain pending.
