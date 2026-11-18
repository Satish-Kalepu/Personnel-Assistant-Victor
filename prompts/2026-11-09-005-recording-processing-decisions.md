# 2026-11-09 — Recording processing choices

## Prompt

> About how many hours per day will auto-record be enabled across all phones?
>
> Under 1 hour
>
> Within the $25–$100 budget, what should happen if recorded audio exceeds the monthly transcription allowance?
>
> Queue audio and ask me what to process (Recommended)
>
> Should ambient recordings remain separate from Victor’s personal knowledge graph unless you explicitly save a finding?
>
> Yes, separate with manual save (Recommended)
>
> How long should raw ambient audio be kept after analysis?
>
> Delete after 7 days (Recommended)

## Questions and decisions

- Expected Auto Record use: under one hour per day total across personal phones.
- When processing allowance is reached: queue audio and ask the user which recordings to process.
- Ambient analysis stays separate from Victor's personal graph unless the user manually saves a finding.
- Delete raw ambient audio seven days after analysis.
- Still open: expiry for audio that remains unprocessed in the queue, exact budget cap and AWS region, and retention for transcripts/summaries.

## Actions

- Updated `notes/ideas.md` and `notes/planning.md` with expected usage, queue behavior, graph isolation, and raw-audio deletion timing.
- Asked follow-up questions about exact spending cap, unprocessed-audio expiry, AWS region, and transcript retention.

## Files changed

- This prompt record, `notes/ideas.md`, `notes/planning.md`, and `dairy.md`.

## Verification

- Checked the four choices and remaining questions in the planning and idea notes. No code tests apply.

## Outcome

- Product choices recorded. The ambient-recording idea remains under discussion because several retention, policy, and device decisions are open. No application code or AWS resources changed.
