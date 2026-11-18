# 2026-11-09 — Private Cognito user email

## Prompt

> Use AWS account email (Recommended)

## Questions and decisions

- Owner approved using the AWS account email for the first private Victor Cognito user and allowing Cognito's one-time invitation email.
- Do not put the email, temporary password, or invitation contents in this repository or chat.

## Actions

- Read the AWS account email only inside a local process, checked for an existing Cognito user, then created the first private Victor user with Cognito's email invitation. Did not print or store the email or temporary password.

## Files changed

- This prompt record and `dairy.md`. No user email or credential was added to source files.

## Verification

- Cognito returned an enabled user in `FORCE_CHANGE_PASSWORD` state; the owner subsequently reported receiving the invitation.

## Outcome

- Private user and invitation created. First sign-in challenge remains to be confirmed.
