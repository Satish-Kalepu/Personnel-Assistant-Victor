# 2026-11-09 — Automatic password detection

## Prompt

> To keep password values out of AI prompts and logs while still entering them in chat, can password messages use a “Save secret” button or command?
>
> No, detect passwords in any chat message

## Questions and decisions

- User chose automatic password detection in any chat message, without a required “Save secret” command or button.
- Automatic classification can miss a password, so the design cannot guarantee that every unmarked secret is withheld from AI processing. This residual risk must be stated in the v1 scope.

## Actions

- Reviewed AWS documentation that describes sensitive-information filtering as probabilistic.
- Updated IDEA-003, `notes/planning.md`, and `notes/v1-scope.md` to use pre-model detection, encrypted secret fields, masked ordinary views, and passkey-gated retrieval while explicitly recording missed-detection risk.
- Asked whether uncertain messages should pause for confirmation and what to do if no offline text-to-speech voice is available.

## Files changed

- This prompt record, `notes/ideas.md`, `notes/planning.md`, `notes/v1-scope.md`, and `dairy.md`.

## Verification

- Checked the automatic-detection choice and risk in the planning notes. No code tests apply.

## Outcome

- Automatic detection recorded with explicit limits and mitigation proposal. No application code or AWS resources changed.
