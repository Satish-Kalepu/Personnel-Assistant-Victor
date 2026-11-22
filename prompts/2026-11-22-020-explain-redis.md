# Explain current Redis responsibilities — 2026-11-22

## Prompt

what are we using redis for ?

## Questions and decisions

- Explain actual current usage rather than general Redis capabilities; no architecture change requested.

## Actions

- Inspect Redis call sites for request throttling, reply coordination, voice leases and readiness.

## Files changed

- This prompt and discussion/diary records only; no runtime/code/configuration change.

## Verification

- Read-only source inspection; no new tests required for explanation.

## Outcome

- Explained current Redis use: expiring request/email counters, per-conversation reply locks, and per-user/global active voice leases (one per user,20 total). Distinguished MongoDB durable identity/history/facts/usage from in-process audio/pending-input state. No runtime changes or tests.
