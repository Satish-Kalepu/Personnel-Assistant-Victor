# 2026-11-09 — Password storage and voice choices

## Prompt

> Should Victor store the actual values of your passwords?
>
> Yes; accept passwords in chat
>
> If a password appears in chat, how should Victor handle the saved conversation and graph?
>
> Keep the full value behind passkey access
>
> Should Victor ever speak a password aloud, even after authentication?
>
> Yes, within the 15-minute window
>
> For the finance category, what should require passkey access?
>
> Account numbers and financial credentials (Recommended)

## Questions and decisions

- Victor should accept and retain actual password values entered in chat, including the full value in the protected conversation and graph representation.
- Reading a password requires passkey access; the user permits speaking one aloud on explicit request within the 15-minute access window.
- Account numbers and financial credentials require passkey access. Other financial facts are not designated confidential by this answer.
- Reliable identification of password values in arbitrary chat text before model processing remains a design issue.

## Actions

- Reviewed AWS attribute-level encryption, Cognito authentication freshness, and Android text-to-speech voice network requirements.
- Updated IDEA-003, `notes/planning.md`, and `notes/v1-scope.md` for protected full-value storage, passkey-gated retrieval, password speech, and the protected finance fields.

## Files changed

- This prompt record, `notes/ideas.md`, `notes/planning.md`, `notes/v1-scope.md`, and `dairy.md`.

## Verification

- Checked the four choices across the planning notes and reviewed official AWS and Android sources. No code tests apply.

## Outcome

- Choices recorded. Automatic password entry and disclosure paths need a decision on uncertain detection and offline speech fallback. No application code or AWS resources changed.
