# 2026-11-09 — AWS CLI setup and Mumbai-only processing

## Prompt

> guide me how to configure aws cli/sso now
>
> i will ask my friend to build it in his android studio later. you can keep creating source
>
> Mumbai processing only (Recommended)

## Questions and decisions

- User needs guided AWS CLI/SSO setup on this computer; do not request credentials in chat.
- Android build will be handled later on a friend's Android Studio computer; continue source preparation here.
- All AI model processing must stay strictly in Mumbai, not merely data at rest.

## Actions

- Confirmed AWS CLI is absent locally and researched current AWS CLI v2 console login and IAM Identity Center setup.
- Created `docs/aws-cli-setup.md` with Windows installation, temporary root-console bootstrap, separate SSO identity, and verification commands. Asked the user to report only the `aws --version` result.
- Constrained the SAM Bedrock parameter to direct `ap-south-1` foundation-model ARNs, excluding inference profiles. Identified Ministral 14B 3.0 as a candidate for later quality/cost testing, not a final selection.
- Recorded the user's plan to have a friend build the Android app later.
- Continued Phase 1 source work: added an atomic DynamoDB monthly chat allowance with configurable per-chat reservation and tests.

## Files changed

- `backend/template.yaml`, `backend/app/core.py`, `backend/app/handler.py`, `backend/tests/test_core.py`, `backend/README.md`, `docs/aws-cli-setup.md`, `notes/v1-scope.md`, `notes/ideas.md`, `notes/aws-resources.md`, `notes/todo.md`, `notes/tech-debt.md`, `README.md`, this prompt record, and `dairy.md`.

## Verification

- Confirmed the ARN pattern accepts a direct Mumbai foundation model and rejects an inference profile. Seven backend tests and Python compileall pass, including cross-mode shared allowance behavior. AWS CLI remains absent until user installation; no AWS access or deployment attempted.

## Outcome

- Setup guide, Mumbai-only source constraint, and preliminary chat allowance are complete; waiting for the user's local CLI installation/SSO progress. Phase 1 implementation remains in progress.
