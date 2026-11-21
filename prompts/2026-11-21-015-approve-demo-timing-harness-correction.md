# Demo timing harness correction approval - 2026-11-21

## Prompt

Reply to: May I correct the new demo test harness to record the first audio chunk exactly once, report overlap explicitly, and keep answer correctness unscored when the transcript is incomplete? The first check received live audio, but its timing field can be misleading. The repair-consent rule in this repository’s AGENTS.md requires explicit approval before repairing a discovered defect.

Answer: Approve this test-harness correction

## Questions and decisions

- Explicit consent covers the new local research timing harness only; no production source or configuration repair.
- Finding: the first synthetic check received audio and final usage, but input transcript was incomplete and output transcript empty. Its 68 ms field could represent a later audio chunk when output began before input ended.
- Intended correction: capture first audio once; store input-end separately; report signed overlap rather than a useful-answer/device latency claim; leave correctness unscored without sufficient evidence. Preserve the original report and recheck with focused tests and one synthetic run.

## Actions

- Preserved original provider-smoke-results-original-invalid-timing.json; added FirstAudioTiming with first-chunk-only capture and independent input-end reference; updated the smoke report and diagnostic labels.
- Added two focused timing checks and ran one corrected synthetic provider experiment.

## Files changed

- This record; demo/audio-timing.mjs, demo/smoke-live.mjs, demo/test/lab.test.mjs, original/corrected provider reports and related README/test/idea/diary evidence.

## Verification

- Both timing checks pass, including pre-input-end audio remaining negative despite later chunks, immutable first/input-end timestamps and missing-reference null handling. All five focused demo checks pass.
- Corrected live run received 230,400 PCM bytes and final usage, but incomplete input transcript and empty output transcript remain. Timing correctly stays null and correctness stays unscored; no claim of a successful 156 spoken answer or acoustic speed.

## Outcome

- Approved timing correction implemented and verified. Separate full-input/transcript/answer investigation remains open; production files untouched.
