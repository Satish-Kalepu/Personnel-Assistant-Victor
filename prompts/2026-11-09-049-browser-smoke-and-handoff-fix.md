# 2026-11-09 — Browser smoke test and handoff correction

## Prompt

> Sign-in and reply work
>
> Yes, correct the handoff note

## Questions and decisions

- The owner reports the live browser page signs in and returns a reply to a harmless English Practice message.
- The owner explicitly approved removing the stale invitation-password instruction from the Android handoff; Cognito now reports `CONFIRMED`.

## Actions

- Removed the obsolete invitation-password instruction from `docs/android-build-handoff.md`; the historical reset-flow finding remains in `dairy.md`.
- Recorded the owner-reported browser sign-in and English Practice reply in the web guide, README, task, deployment review, and diary.

## Files changed

- This prompt record; `docs/android-build-handoff.md`, `docs/web-client.md`, `README.md`, `notes/todo.md`, `notes/deployment-review.md`, and `dairy.md`.

## Verification

- Read back the Android handoff to confirm the obsolete instruction is gone; the current Cognito status statement remains. Browser sign-in/reply result is owner-reported, not independently observed by the agent.

## Outcome

- Handoff note corrected with consent. Live browser sign-in and English Practice reply reported successful. Personal chat, memory correction/deletion, and logout still need user validation.
