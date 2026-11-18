# 2026-11-09 — Confidential categories and immediate memory

## Prompt

> Which categories should Victor treat as confidential? Please list the categories and one or two examples for each (for instance, work information, finances, health, identity details, or relationships).
>
> only
> finance bank account and passwords
> other personnel passwords.
>
> When Victor extracts a new fact from your chat, should it enter the graph immediately or wait for your review?
>
> it should immediately enter the graph
>
> How long should Victor keep the full source conversations that support graph facts?
>
> Until I delete them (Recommended)

## Questions and decisions

- User-defined confidential categories are financial/bank-account information and passwords, including other personal passwords. Other data is not automatically confidential under this policy.
- Extracted facts should enter the personal graph immediately, with source references and later correction/deletion.
- Keep full source conversations until the user deletes them.
- Password values in full chat transcripts create a security conflict that needs a specific storage and retrieval decision.

## Actions

- Reviewed OWASP password/secrets guidance and AWS documentation for encrypted storage, model invocation logging, and per-secret pricing.
- Updated IDEA-002 and IDEA-003, `notes/planning.md`, and `notes/v1-scope.md` with immediate graph insertion, source retention, and the chosen confidential categories.
- Flagged that actual password values in chat may be copied into transcripts, model requests, graph facts, or logs; proposed separate secret-value handling pending user choice.
- Asked whether Victor stores actual passwords, how chat-entered passwords are handled, whether passwords may be spoken, and which financial fields need step-up.

## Files changed

- This prompt record, `notes/ideas.md`, `notes/planning.md`, `notes/v1-scope.md`, and `dairy.md`.

## Verification

- Checked the three choices across idea, planning, and v1 scope notes and reviewed primary security sources. No code tests apply.

## Outcome

- Planning choices recorded; password-value handling is the remaining security-critical design decision. No application code or AWS resources changed.
