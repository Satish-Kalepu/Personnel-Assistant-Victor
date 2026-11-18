# 2026-11-09 — Keep chat reservation

## Prompt

> Keep 5¢ initially (Recommended)

## Questions and decisions

- Owner chose to keep the conservative 5-cent chat reservation for the initial deployment review. Under the $50 app allowance this permits at most 1,000 chat attempts per month, regardless of actual Bedrock token cost.

## Actions

- Record the decision in the Phase 1 deployment notes and task/debt tracking.

## Files changed

- This prompt record, `notes/ideas.md`, `notes/todo.md`, `notes/tech-debt.md`, `notes/aws-resources.md`, `notes/deployment-review.md`, and `dairy.md`.

## Verification

- The current SAM parameter default is `ChatReserveCents: 5`; no code change is required.

## Outcome

- Decision recorded in the deployment review; the template already defaults to 5 cents. No code change was needed for this choice.
