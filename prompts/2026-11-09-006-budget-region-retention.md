# 2026-11-09 — Budget, region, and retention choices

## Prompt

> What monthly AWS spending limit should the app use for processing decisions, within your $25–$100 target?
>
> $50 (Recommended)
>
> If an audio recording is still waiting in the queue, when should it be deleted?
>
> After 7 days
>
> Which AWS region should hold your recordings and personal data?
>
> Mumbai, ap-south-1 (Recommended)
>
> How long should transcripts and ambient summaries remain after the raw audio is deleted?
>
> Keep until I delete them (Recommended)

## Questions and decisions

- Use $50/month as the app's processing decision limit; this is a target, not yet an AWS-wide hard billing cap.
- Delete unprocessed queued ambient audio after seven days.
- Use AWS Asia Pacific (Mumbai), `ap-south-1`, for personal data and recordings.
- Keep ambient transcripts and summaries until the user deletes them.
- Previously chosen: delete analyzed raw ambient audio seven days after analysis.

## Actions

- Updated `notes/ideas.md` and `notes/planning.md` with the chosen limit, region, and retention rules.
- Verified that Amazon Transcribe supports batch and streaming in Mumbai. Reviewed AWS Budgets timing and action behavior; it does not provide a guaranteed hard cap on the account bill.
- Asked follow-up questions about recording jurisdiction/notification, confidential step-up, first-version wake phrase, and languages.

## Files changed

- This prompt record, `notes/ideas.md`, `notes/planning.md`, and `dairy.md`.

## Verification

- Checked notes for the four choices and reviewed current AWS documentation on budgets and Transcribe region support. No code tests apply.

## Outcome

- Planning choices recorded. The seven-day unprocessed-audio expiry may occur before next month's allowance is available; this tradeoff is flagged for confirmation. No application code or AWS resources changed.
