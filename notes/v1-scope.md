# Victor v1 scope — review draft

**Status:** Approved as the v1 build baseline on 2026-11-09. Phase 1 implementation authorized. This consolidates the choices in `notes/ideas.md` and the source research in `notes/planning.md`. Technical validations below remain open, with the identified risks kept visible.

## User experience

| ID | Proposed v1 behavior | Acceptance check |
| --- | --- | --- |
| V1-01 | Privately install Victor on multiple Android phones under one personal account. Text chat and push-to-talk work from each phone. | A chat started on phone A is visible on phone B after sync; a signed-out phone cannot retrieve it. |
| V1-02 | Launch Victor through a Google Assistant App Action such as “Hey Google, open Victor,” plus an app button. Test standalone “Hi Victor” after choosing a phone. | The Assistant phrase opens Victor's chat screen on the target phone. |
| V1-03 | In Personal mode, retain Victor source conversations until deleted. Extracted facts enter the graph immediately with source, timestamp, and confidence; facts remain until corrected or deleted. Detected secret spans retain their full encrypted value in the protected source and graph property while ordinary views are masked. | A new fact appears without a review step and can be traced, corrected, or deleted. Without passkey access, detected secret values are masked in source and graph views. |
| V1-04 | English Practice has separate conversations, storage, and retrieval permissions. It does not write to or read from personal memory. Proposed default: retain practice sessions until the user deletes them. | A practice-only fact is absent from personal search and graph queries; personal facts are unavailable in practice mode. |
| V1-05 | Account numbers, financial credentials, and personal passwords are confidential. Retrieval requires a server-verified passkey check valid for 15 minutes on the current session/device. Victor may speak any confidential value, including a password, only after authentication and an explicit request within that window. Password speech uses an offline voice or falls back to private display. | API calls without the required classification access fail, including direct query, summary, and speech paths; an explicit spoken-password request within the window either uses an offline voice or displays privately. |
| V1-06 | Auto Record starts when enabled in the visible Android app, records available microphone audio, shows active/interrupted state, and queues encrypted chunks for upload. | The app records start/end times and gaps; stop/delete works; a reboot does not falsely claim recording continued. |
| V1-07 | Ambient processing favors live speech and meetings. TV is processed only when requested. The app shows and permits correction of its category. Ambient findings stay outside the personal graph unless manually saved. | A TV-labeled segment is not automatically transcribed; a manually saved finding appears in the graph with source. |
| V1-08 | Use an app-level $50/month processing decision limit across all phones. When the allowance is reached, queue recordings and ask what to process. | A job that would cross the remaining allowance is held and visible; the user can select or delete queued audio. AWS budget alerts supplement this but are not a guaranteed bill cap. |
| V1-09 | Delete unprocessed ambient audio seven days after capture and analyzed raw audio seven days after analysis. Keep ambient transcripts and summaries until deleted by the user. Warn before queued audio expires. | Time-based deletion covers phone and cloud copies; the UI shows expiry, allows manual deletion, and a deleted item is unavailable to retrieval. |
| V1-10 | Connect personal and company Gmail separately. Store only sender, subject, date, short summary, and action items for 90 days after the email arrives; do not persist message bodies or attachments. The start of the 90-day period is a proposed default. | A new message produces only those stored fields; account boundaries hold; the 90-day expiry removes the summary. OAuth/admin access must be validated. |
| V1-11 | Detect passwords in any chat message before AI processing. Retain detected values as encrypted source and graph fields, masked without passkey access. Pause uncertain messages for user confirmation. | A detected password is absent from model input and logs; an uncertain message is held until answered. Test a varied corpus and report misses, since confident false negatives cannot be ruled out. |

## Candidate technical shape

- **Android:** Kotlin app with explicit modes; a microphone foreground service for Auto Record; encrypted local queue and WorkManager uploads subject to battery/network constraints.
- **AWS Mumbai (`ap-south-1`):** Cognito for identity and step-up, API Gateway and Lambda for APIs, DynamoDB for conversations/facts/relationships and job state, S3 for temporary audio, SQS and Step Functions for asynchronous processing, Transcribe for speech, Bedrock model selected after a region/cost check, KMS encryption, CloudWatch and AWS Budgets for monitoring.
- **AI processing location (approved 2026-11-09):** Bedrock inference must run strictly in Mumbai. Do not use cross-Region or geography inference profiles; select and verify a direct `ap-south-1` foundation model before deployment.
- **Gmail:** Google OAuth for each account; Google Cloud Pub/Sub mailbox watch into an authenticated AWS endpoint; periodic reconciliation because notifications can be missed. Company permission is reported; the Workspace administrator must still allow the app and scopes.
- **Data separation:** Personal memory, English Practice, ambient recordings, personal Gmail, and company Gmail are separate authorization domains. Saving an ambient finding to the personal graph is an explicit user action. Detected password values are kept as encrypted fields in protected conversation and graph records. Ordinary graph indexes/views contain masked metadata; retrieval bypasses the LLM and requires passkey authorization. Automatic detection can miss an unmarked value, so LLM exclusion cannot be guaranteed.

## Remaining design gates

1. **Automatic password detection:** The user chose to store actual password values from any chat message and may request spoken output in the 15-minute passkey window. A pre-model detector must identify secret spans for encryption, masking, and isolated retrieval. Uncertain messages pause for confirmation. A confident false negative can still reach the model, so the user should review this residual risk before finalizing the feature. [Bedrock sensitive-filter limits](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-sensitive-filters.html).
2. **Recording rules:** The user reports company permission to record and upload work meetings. Its conditions and the rules for unannounced recording in other settings need review. Android recording status stays visible; no indicator-hiding behavior is planned.
3. **Target phone:** Choose a model/version and test microphone service behavior, battery drain, Google Assistant launch, and simultaneous use across phones.
4. **Cost:** Determine actual Mumbai prices and reserve part of the $50 limit for chat, Gmail summaries, storage, and monitoring. The app gate uses estimates; AWS billing alerts can lag.
5. **Memory quality:** Immediate graph insertion and indefinite source-conversation retention are selected. Define the extraction threshold, correction UI, and conflict handling; test false or contradictory facts before trusting them in answers.
6. **Retention details:** Proposed defaults are Gmail expiry 90 days after email arrival and English Practice sessions retained until user deletion. Failed raw-audio jobs follow the seven-day unprocessed-audio expiry, with error notices before deletion. The user can revise these defaults when deciding the scope.
7. **Secret speech:** Test an offline Android text-to-speech voice on the selected phone; if unavailable, show the password privately instead. A voice that requires network access could send a spoken password outside the app's backend path. [Android Voice API](https://developer.android.com/reference/android/speech/tts/Voice).

## Suggested build slices after scope approval

1. Private sign-in, text chat, Personal/English Practice isolation, and basic memory review.
2. Voice chat, server-enforced confidential retrieval, passkey step-up, and cross-device sync.
3. Personal and company Gmail summary pipelines, separate scopes, and expiry.
4. Auto Record on the chosen phone, queued uploads, budget gate, post-processing, and retention.
5. Google Assistant App Action and device-specific battery testing; evaluate custom “Hi Victor” afterward.
