# Approve paused voice input retention repair — 2026-11-22

## Prompt

Reply to: May I fix this by retaining finalized statements in order across pauses, cancelling the assistant’s reply without losing pending user input, and testing interrupted processing, duplicates and corrections before redeploying staging? Some statements may be grouped into one reply. The repository’s AGENTS.md “Repairs require consent” rule requires explicit approval before I change the diagnosed behavior.

Approve preserving statements and staging repair

## Questions and decisions

- Explicit consent covers the diagnosed input-retention defect, regression checks and staging redeployment.
- Preserve ordered finalized speech independently of reply generation. New speech cancels playback/rendering of superseded replies; accepted input processing may finish so facts/history are not lost. Queue later input serially and group pending segments when appropriate. Keep640ms endpoint and existing tenant/mode/privacy/usage boundaries.

## Actions

- Reproduced both loss paths before repair. Forwarded delayed earlier finals with utterance/pending state; added bounded ordered input queue, serial grouped processing, segment deduplication and stable retry IDs; reply cancellation no longer aborts accepted input processing. Stop/logout still abort and clear unsaved work.
- Added regression cases for delayed finals, continued speech during processing, correction order, duplicates/repeated words, empty transcripts, ambiguous post-commit retry and stop. Added real database history/fact preservation coverage.
- Early combined test attempts had auth-fixture readiness/rate-budget failures; asserted signed native login and separated the new synthetic client identity, then ran all35 checks successfully in a fresh isolated test project. Production auth controls unchanged.
- Built source-hashed stage-owned-4becaff17ef6; final API filesystem matches the tested runtime. Approved staging deployment in progress; public three-fact acceptance still pending.
- Deployment completed healthy; local real-VAD stimulus has three separate640ms endpoints with900ms gaps. First public checker timed out; exact synthetic account probe verified all three history statements and all three stored facts. The test completion condition can miss TTS completion while waiting for its trailing-silence buffer; proposed a checker-only correction/fresh account and requested separate explicit consent. No further runtime change and no checker repair applied pending that consent. Synthetic account removed after storage verification.

## Files changed

- API voice adapter/session, scoped transport/session/integration regressions and new voice-retention test; synthetic fixture/stage check helpers; research14 and original reproduction/evidence; prompts001/002 and linked IDEA-017/TASK-020/DEBT-012/diary. No schema, endpoint timing, model/provider, auth limit or unrelated runtime changes.

## Verification

-35 isolated app/auth/tenant/voice/retention/database checks passed. TypeScript/image builds and JS/whitespace/source-key checks passed. Final image filesystem identical to tested runtime; three remote image fingerprints matched. Test containers stopped with volumes preserved; no active stage voice sessions before rollout.
- Stage-owned-4becaff17ef6 deployed healthy with existing DB uptime retained. After first checker timeout, exact synthetic account had all three facts/history; checker repair received separate consent in prompt003. Fresh empty account then passed three900ms-separated speech segments, all three facts/history and204480 nonzero PCM bytes (peak24622). Both synthetic accounts removed/absence verified, no email, global spend preserved. Final public health200/private anonymous401 checked. No human microphone/Pixel/reconnect durability claim.

## Outcome

- Approved retention repair deployed and verified; TASK-020 complete for stated scope.640ms timing and authoritative data/auth/usage controls retained. Broader DEBT-012 limits stay open. Records, original failure and fresh success evidence saved in report14; code remains in working tree, not committed/pushed.
