# 2026-11-09 — Meeting permission and confidential voice behavior

## Prompt

> Does your company explicitly allow you to record work meetings and upload their audio or transcripts to your personal AWS account?
>
> Yes, explicitly allowed
>
> Which data should require the fresh passkey check before Victor retrieves or speaks it?
>
> I’ll define categories
>
> When confidential information is requested by voice, how should Victor respond after authentication?
>
> Speak it aloud if I ask

## Questions and decisions

- User reports explicit company permission for recording work meetings and uploading audio/transcripts to personal AWS.
- User will define confidential-data categories; classification policy remains pending.
- After fresh authentication, Victor may speak confidential content only when the user explicitly requests spoken output.
- Permission for other unannounced personal recordings remains context dependent.

## Actions

- Updated `notes/ideas.md` and `notes/planning.md` with reported company permission, the pending confidentiality taxonomy, and explicit spoken-output behavior.
- Treated the previously chosen seven-day queue expiry as applying even when the next monthly allowance has not started, with an expiry warning; avoided asking the user to repeat that decision.
- Asked follow-up questions about processing priority, Gmail summary and graph retention, and passkey freshness.

## Files changed

- This prompt record, `notes/ideas.md`, `notes/planning.md`, and `dairy.md`.

## Verification

- Checked the three replies and the queue-expiry rule in the planning notes. No code tests apply.

## Outcome

- Planning choices recorded. Confidential categories and several retention/processing settings remain open. No application code or AWS resources changed.
