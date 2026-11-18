# 2026-11-09 — Create Identity Center user

## Prompt

> No, I need to add one
>
> No assignment is listed

## Questions and decisions

- The existing IAM Identity Center instance has no sign-in user for the owner and no assignment on the personal account.
- Guide user creation and choose account permission level before assignment.

## Actions

- Guided Users → Add user, email invitation, and local password/MFA setup. Asked whether the user is active.
- Asked whether to use a temporary AdministratorAccess permission set for bootstrap or prepare a scoped deployment role first.

## Files changed

- This prompt record and `dairy.md`.

## Verification

- Based on user-reported console state and official AWS add-user guidance; no agent AWS access.

## Outcome

- Waiting for the user's account-permission preference and user-creation result. No credentials were shared or AWS changes made by the agent.
