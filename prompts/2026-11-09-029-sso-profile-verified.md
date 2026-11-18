# 2026-11-09 — SSO profile verified

## Prompt

> Yes, correct account
>
> ap-south-1

## Questions and decisions

- User reports the `victor` SSO profile resolves to the intended personal AWS account and default Region `ap-south-1`.
- Continue Phase 1 read-only pre-deployment checks. Do not deploy without reviewing the concrete stack and cost.

## Actions

- Confirmed the profile's `ap-south-1` default locally. Used read-only STS, Bedrock model catalog/access, and CloudFormation template-validation calls through the SSO profile.
- Bedrock returned the proposed model's direct Mumbai ARN, `ACTIVE` lifecycle, `ON_DEMAND` inference, and account access `AUTHORIZED`/`AVAILABLE`.
- CloudFormation validation exposed malformed YAML at template line 133. Explained the evidence, deployment impact, and two-route quoting repair; requested explicit consent before editing.

## Files changed

- `notes/aws-resources.md`, this prompt record, and `dairy.md`. The template repair is recorded in prompt 030.

## Verification

- Local CLI returned `ap-south-1`; read-only STS succeeded and returned only account-ID length 12. Bedrock catalog and availability calls succeeded. Initial CloudFormation validation failed at line 133, column 54.

## Outcome

- Account and model access verified. The validation defect was repaired with the user's subsequent explicit consent; see prompt 030. No AWS resources deployed or model inference invoked.
