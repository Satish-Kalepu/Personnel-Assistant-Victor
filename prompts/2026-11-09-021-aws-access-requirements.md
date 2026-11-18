# 2026-11-09 — AWS access requirements

## Prompt

> okay. when do i provide aws credentials and what privilege permissions do you need. add it in aws-requirement.md file

## Questions and decisions

- User requests a written AWS access timeline and required privileges.
- Use locally configured temporary CLI/SSO credentials; do not ask for secrets in chat.

## Actions

- Inspected the Phase 1 SAM template and official CloudFormation/SAM/Bedrock IAM guidance.
- Created `aws-requirement.md` with access timing, non-root local SSO use, deployer/service/runtime role boundaries, current permissions, and later-phase exclusions.

## Files changed

- `aws-requirement.md`, `README.md`, this prompt record, and `dairy.md`.

## Verification

- Cross-checked the requirement list against current SAM resources and official AWS IAM/deployment documentation. No AWS credentials were accessed and no deployment was attempted.

## Outcome

- Document created. AWS CLI/SSO setup and a reviewed deployment change set remain future steps.
