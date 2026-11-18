# 2026-11-09 — Identity Center versus Cognito password

## Prompt

> i changed password in aws identity center -> users -> victor-admin -> reset password
> it sent reset password email as well.
> I have also logout and login multiple times on [AWS access portal URL omitted].

## Questions and decisions

- The owner reset the IAM Identity Center `victor-admin` password and signed into the AWS access portal. That identity is separate from Victor's Cognito app user, even if they use the same mailbox.
- The AWS access portal URL was omitted from this record because it is unnecessary for the project notes.

## Actions

- Distinguished AWS IAM Identity Center from Victor Cognito sign-in and prepared the exact Cognito sign-in link using the public, locally stored deployment configuration.
- Added first-sign-in guidance to the Android build handoff.

## Files changed

- This prompt record and `docs/android-build-handoff.md`.

## Verification

- The Cognito sign-in page previously returned HTTP 200; the locally stored public domain and client ID match the deployed configuration recorded during Phase 1 verification. AWS Cognito documentation confirms that an administrator-created user remains in `FORCE_CHANGE_PASSWORD` until completing the first-sign-in new-password challenge.
- A new read-only CloudFormation query was unavailable because `aws` is not on this tool session's PATH. No AWS mutation was attempted.

## Outcome

- The owner needs to use the Victor Cognito invitation's temporary password at the separate Victor sign-in page and set a new Cognito password. The user's reported Identity Center reset does not change the Cognito status. Awaiting the owner's first-sign-in result.
