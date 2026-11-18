# 2026-11-09 — Processing priority, retention, and authentication window

## Prompt

> While Auto Record captures everything, which parts should the post-processing pipeline transcribe within the $50 limit?
>
> Speech and meetings first; TV on request (Recommended)
>
> How long should Gmail summaries be kept?
>
> 90 days
>
> How long should facts extracted from Victor chats stay in the personal knowledge graph?
>
> Until I delete or correct them (Recommended)
>
> How long should a successful passkey check unlock confidential retrieval?
>
> 15 minutes

## Questions and decisions

- Prioritize speech and meetings for transcription; process TV audio only on explicit request, within the $50/month processing gate.
- Delete retained Gmail summaries after 90 days.
- Retain facts extracted from Victor conversations until the user corrects or deletes them.
- A successful passkey check unlocks confidential retrieval for 15 minutes; server checks expiry and authorization on each request.

## Actions

- Updated `notes/ideas.md` and `notes/planning.md` with all four choices.
- Created `notes/v1-scope.md`, a review draft with proposed behaviors, acceptance checks, candidate architecture, and remaining design gates.

## Files changed

- This prompt record, `notes/ideas.md`, `notes/planning.md`, `notes/v1-scope.md`, and `dairy.md`.

## Verification

- Checked the four decisions across idea, planning, and scope notes. No code tests apply to planning-only work.

## Outcome

- Planning choices recorded in a reviewable v1 scope. The ideas remain under discussion pending the user's review and the listed design gates. No application code or AWS resources changed.
