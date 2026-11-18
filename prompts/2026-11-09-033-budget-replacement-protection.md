# 2026-11-09 — Budget replacement protection

## Prompt

> Yes, add and validate (Recommended)

## Questions and decisions

- Owner explicitly approved adding `UpdateReplacePolicy: Retain` to the new AWS Budget resource after SAM lint reported the missing protection.

## Actions

- Added `UpdateReplacePolicy: Retain` to `MonthlyAccountBudget` after the user's explicit consent. Reran SAM lint, local build, and lint on the built template.

## Files changed

- `backend/template.yaml`, this prompt record, and `dairy.md`.

## Verification

- SAM lint passed on source and built templates; local SAM build succeeded. No AWS deployment occurred.

## Outcome

- The approved Budget protection repair is verified.
