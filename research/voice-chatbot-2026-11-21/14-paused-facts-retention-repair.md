# Preserve voice statements across pauses

2026-11-22. User report and investigation: [prompt001](../../prompts/2026-11-22-001-investigate-paused-voice-facts.md). Explicit repair/redeploy consent: [prompt002](../../prompts/2026-11-22-002-approve-paused-voice-retention-repair.md). IDEA-017 / TASK-020 / DEBT-012.

## Diagnosis and reproduced failure

The user reported smooth staging voice but missing earlier statements when dictating several facts with short gaps. A synthetic, local-socket reproduction established two independent paths:

1. The STT adapter incremented the current utterance on each speech start, then forwarded a final transcript only if its pending utterance equaled the latest one. An older sentence finalized after the next sentence started was discarded.
2. The voice session aborted the model request whenever speech resumed. The backend stores the user message and extracted facts only after a successful model result, so interrupted input could disappear before persistence. There was no ordered pending-input queue to carry it into later processing.

The 640ms silence rule makes these paths easier to encounter, but increasing the rule alone does not fix loss. The [raw pre-repair evidence](owned-server-poc/evidence-paused-facts-2026-11-22.json) contains three synthetic statements with only the last forwarded/simulated commit. Its abort flags are sampled after cleanup: the last completed request is also marked aborted by session teardown; pre-cleanup assertions checked that only the first two were interrupted during processing. No real provider, database or personal audio was used for diagnosis. [Historical reproduction](owned-server-poc/reproduce-paused-facts-before-fix.mjs) intentionally asserts the old defect and should run only against the prior implementation.

## Approved repair

- Forward every finalized pending speech segment, with an ordered session-local utterance identity and explicit speech/pending-transcript state. Ignore duplicate segment delivery without deduplicating legitimate repeated words.
- Queue pending statements while speech is active or its finalized transcripts are outstanding. Group ready pending text in order within the existing 4000-character request bound; do not silently truncate it.
- Separate assistant reply/playback generation from accepted input processing. New speech immediately clears the superseded reply, but an in-flight input request can finish and save its history/facts. Later input is serialized, so it sees earlier committed context rather than racing the conversation lock.
- Give each input batch a stable client-message ID. If a backend result is ambiguous after committing, retry the same ID/content before later text; the existing backend idempotency check prevents duplicate facts/reservations. Processing failures retain the batch in the open session, report the problem, and wait for further input to retry rather than looping.
- Keep stop/logout/session expiry as cancellation boundaries: they abort active requests and clear unsaved queued work. Queue bounds fail explicitly rather than pretending excess input was saved. Mode isolation, secret holds, usage controls and checked speech remain in the authoritative backend.

The endpoint remains 640ms. This is input conservation, not a semantic-endpoint change or a new model/provider selection. It may let an already accepted model call consume its normal reservation after the assistant’s speech has been interrupted. Pending speech remains session-local, not a durable offline/reconnect journal. Existing five-fact extraction and context limits remain; retaining every statement does not remove those limits or automatically merge/correct contradictory stored facts.

## Verification

All 35 app/transport/retention/auth/database checks passed in a fresh isolated Compose project. New coverage includes delayed earlier finals, three ordered statements, continued speech during processing, stale reply suppression, correction order, duplicate IDs versus repeated words, empty final transcripts, ambiguous commit retries, real MongoDB history/fact retention, and stop/logout cancellation. Practice isolation and secret/tenant controls remain covered.

Earlier combined test attempts had a readiness timeout and then explicit429/mail-fixture failures from shared synthetic-client rate budgets. The added regression now asserts its signed native login, uses a separate synthetic client identity, and the final run used a fresh isolated project; production rate limits were unchanged. The isolated regression passed separately before the complete run. No unrelated auth repair or real-user data change occurred. Test containers were stopped with volumes preserved.

Final build tag: `stage-owned-4becaff17ef6`; source SHA-256 `4becaff17ef6b9003be81128c3061017211cc6e53968b7878fe724aad7de5e26`. The deployment API filesystem was verified identical to the tested API image (the later source-hash change covers test setup). Images are built from the working tree; no commit/push is claimed.

The release is deployed and healthy, with all three image-layer fingerprints verified and existing database container uptime retained. Local real-VAD fixture verification confirmed three separate speech starts/ends for the hiking, green-tea and Spanish-learning phrases with900ms gaps: [VAD evidence](owned-server-poc/evidence-paused-facts-vad-2026-11-22.json).

The first public checker timed out. A subsequent authenticated inspection restricted to its exact synthetic account confirmed all three user statements and all three independently extracted facts persisted: [timeout/storage probe](owned-server-poc/evidence-paused-facts-timeout-probe-2026-11-22.json). No real user’s data was queried. The checker’s completion condition required its full trailing-silence buffer to be sent before considering a TTS completion event; an earlier event could therefore be missed. That event-gating race was corrected only after separate explicit approval in [prompt003](../../prompts/2026-11-22-003-approve-paused-facts-checker-correction.md). Original failure evidence is retained.

## Final fresh-account staging result

The corrected checker required an empty synthetic account and verified three separate speech starts with900ms gaps. All three statements and all three facts were present, and204480 bytes of nonzero PCM returned (peak24622): [complete live evidence](owned-server-poc/evidence-paused-facts-staging-2026-11-22.json).

| Spoken statement | Saved fact |
|---|---|
| My favorite outdoor activity is hiking. | favorite outdoor activity → hiking |
| My preferred drink is green tea. | preferred drink → green tea |
| I am learning Spanish. | is learning → Spanish |

Both synthetic accounts were removed after their checks, with exact-account absence verified. No test email sent; real accounts and global spend accounting preserved. Staging health200/private anonymous profile401, API/web/worker health and unchanged database uptime were checked after cleanup. Local test projects are stopped with volumes retained. Runtime release remains `stage-owned-4becaff17ef6`; the checker-only correction did not require another runtime deployment.

TASK-020 is complete for the approved pause-retention repair. The queue remains bounded/session-local, stop/logout/disconnect can cancel unsaved work, and normal input processing may finish during a speech interruption. No human microphone/Pixel, acoustic speed, reconnect durability or historical missing-fact reconstruction is claimed. Earlier facts that were never persisted may need to be spoken again. The standalone Python research demo retains its simplified historical cancellation implementation; the repaired path is the actual Node staging app.
