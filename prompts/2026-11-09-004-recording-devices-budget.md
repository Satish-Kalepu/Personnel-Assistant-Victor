# 2026-11-09 — Recording, devices, email fields, and budget

## Prompt

> Is the separate auto-record feature still intended to capture in-person conversations when you manually enable it?
>
> I mean, when i enable "auto record" feature, it records microphone and captures everything, whether i am talking to my friend or sit in a meeting or watching tv. everything a phone microphone can listen . we need post processing pipelines to be built .
>
> What phone model and Android version will be used for the private install?
>
> not choosen yet, but it would be latest. But i am going to use android only. i may use the same app on multiple of my personnel phones.
>
> For company email, should we keep only sender, subject, date, a short summary, and action items, with no full body or attachments?
>
> Yes, that summary only (Recommended)
>
> What is your approximate monthly AWS budget for this assistant?
>
> $25–$100 (Recommended)

## Questions and decisions

- Clarified that enabled auto-record should capture ambient microphone audio, including conversations, meetings, and TV, followed by post-processing.
- Android-only, privately installed on potentially multiple personal phones; exact model is not chosen.
- Company email stored fields: sender, subject, date, short summary, and action items; no full body or attachments.
- Target AWS spend: $25–$100 per month.
- Remaining decisions include recording hours, processing latency, raw-audio retention, country/participant-consent practices, and AWS region.

## Actions

- Reviewed current AWS transcription pricing examples and Android microphone/boot restrictions.
- Updated IDEA-001, IDEA-005, and IDEA-007 with the new scope and constraints.
- Added an Auto Record post-processing proposal and transcription-only cost illustration to `notes/planning.md`.
- Asked follow-up questions about daily recording hours, over-budget behavior, graph separation, and raw-audio retention.

## Files changed

- This prompt record, `notes/ideas.md`, `notes/planning.md`, and `dairy.md`.

## Verification

- Checked the planning note against official AWS and Android sources. No code tests apply to this planning-only update.

## Outcome

- Recording scope, multi-device support, email summary fields, and budget target recorded. Processing volume and retention remain open. No application code or AWS resources changed.
