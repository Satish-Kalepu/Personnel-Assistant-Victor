# 2026-11-09 — Uncertain secret and offline speech behavior

## Prompt

> When Victor is unsure whether a chat message contains a password, should it pause and ask before sending that message to the AI?
>
> Yes, ask on uncertain messages (Recommended)
>
> If your phone has no usable offline voice for speaking a password, what should Victor do?
>
> Show it privately instead (Recommended)

## Questions and decisions

- If automatic password detection is uncertain, pause and ask the user before sending the message to the AI.
- If no usable offline text-to-speech voice exists on the phone, show the password privately rather than using a cloud voice.
- Confident false negatives remain possible; these controls reduce but do not eliminate automatic detection risk.

## Actions

- Updated IDEA-003, `notes/planning.md`, and `notes/v1-scope.md` with uncertain-message confirmation and offline-voice fallback.
- Made the v1 scope decision-ready with explicit, revisable defaults for Gmail expiry, English Practice retention, and failed-audio cleanup.

## Files changed

- This prompt record, `notes/ideas.md`, `notes/planning.md`, `notes/v1-scope.md`, and `dairy.md`.

## Verification

- Checked the two choices, fallback behavior, and residual false-negative risk in the scope and planning notes. No code tests apply.

## Outcome

- Choices recorded and v1 scope prepared for explicit user decision. No app code or AWS resources changed.
