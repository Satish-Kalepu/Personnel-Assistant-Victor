# Approve paused-facts checker correction — 2026-11-22

## Prompt

Reply to: May I correct the new checker’s completion condition and rerun it with a fresh synthetic account? Staging already saved all three facts; this change is limited to making the regression finish and record its audio evidence reliably. AGENTS.md explicitly requires consent to repair a discovered test defect.

Approve checker correction and fresh run

## Questions and decisions

- Explicit consent covers only the diagnosed completion condition, reliable evidence recording and a fresh synthetic-account regression. Runtime retention repair is already deployed under prompt002.

## Actions

- Accept completion after the final speech sample rather than waiting for all trailing test silence. Require an initially empty synthetic account; record failure events as well as success. Recreate exact fixture and rerun.

## Files changed

- This prompt; deploy/scripts/check-paused-facts-stage.mjs; linked evidence/research/diary records.

## Verification

- Fresh-account guard verified an empty history/fact set. Corrected checker passed three speech starts with900ms gaps, all three user statements and all three saved facts, plus204480 output PCM bytes/peak24622. Exact synthetic account removed and absence checked; global spend/real accounts preserved. Checker JS syntax passed. Earlier timeout/storage probe retained.

## Outcome

- Scoped checker correction verified. Runtime remains the already deployed stage-owned-4becaff17ef6; no additional runtime deployment or unrelated repair. Main TASK-020 acceptance complete.
