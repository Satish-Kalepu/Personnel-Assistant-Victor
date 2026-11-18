# 2026-11-09 — SAM installed

## Prompt

> installed

## Questions and decisions

- Interpreted this as confirmation that AWS SAM CLI was installed after the preceding setup step.
- Proceed with local build and validation only; no AWS deployment is authorized by this confirmation.

## Actions

- Verified AWS SAM CLI 1.171.0 at its installed full path. The current shell did not yet have `sam` on `PATH`.
- Ran basic and lint validation on the source template using the `victor` SSO profile.
- Tried a Docker ARM64 build; the container exited with `exec format error` on the x86_64 host. Stopped the stalled build command.
- Built locally with SAM into a temporary directory, then linted the built template.
- Prepared a deployment review draft covering parameters, resources, cost assumptions, and remaining checks. Asked the owner to choose the model proposal, Cognito domain approach, log retention repair, and AWS budget-alert mailbox.
- Found that the template leaves CloudWatch log retention at AWS's indefinite default. Explained the impact and proposed a 14-day repair; owner consent is pending. A read-only account check found no existing AWS Budgets.

## Files changed

- This prompt record, `notes/aws-resources.md`, `notes/deployment-review.md`, `README.md`, and `dairy.md`. No application source changed.

## Verification

- Source SAM validation and lint passed. Local SAM build succeeded without external Python dependencies. Built-template lint passed. Docker ARM64 build failed because the host could not execute the ARM64 builder.
- Read-only `budgets describe-budgets` returned an empty result in the intended account. AWS pricing/docs checked for the draft cost illustration and log-retention behavior.

## Outcome

- Phase 1 backend package builds locally and validates. Model/domain, log-retention consent, and budget-alert destination decisions remain pending. ARM64 container/runtime and Android device verification remain open. No AWS deployment occurred.
