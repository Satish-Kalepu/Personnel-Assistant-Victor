# 2026-11-09 — Cognito flow and budget note fix

## Prompt

> In Victor/Cognito sign-in (Recommended)
>
> Yes, fix the note (Recommended)

## Questions and decisions

- Owner reports setting the password in Victor/Cognito sign-in, although Cognito previously still returned `FORCE_CHANGE_PASSWORD`.
- Owner explicitly approved restoring the missing `$50` in TASK-010's account-wide budget sentence.

## Actions

- Restored `$50` in TASK-010 and updated the note to reflect the deployed budget; verified the corrected line.
- Attempted a read-only Cognito status recheck. The `victor` IAM Identity Center SSO session had expired, so the call did not reach Cognito. Asked the owner to refresh SSO locally; no password or account setting was changed.

## Files changed

- `notes/todo.md`, this prompt record, and `dairy.md`.

## Verification

- `rg` confirmed TASK-010 now states `$50 account-wide AWS Budget`. Cognito status could not be rechecked because botocore reported `UnauthorizedSSOTokenError`.

## Outcome

- Approved note repair is complete. Cognito status clarification awaits a refreshed SSO session.
