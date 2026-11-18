# Ideas and decisions

Use one ID per idea (`IDEA-001`, `IDEA-002`, ...). Keep discussion and explicit decisions here; link resulting tasks and debt entries.

## Entry template

### IDEA-XXX — Short title

- **Opened:** YYYY-MM-DD
- **Status:** Discussing | Finalized | Superseded
- **Summary:**
- **Options and tradeoffs:**
- **Open questions:**
- **Decision:** Pending, or the user's explicit choice with date and rationale
- **Related tasks:** None yet
- **Related tech debt:** None known, or debt IDs

<!-- Add new ideas below this line. -->

### IDEA-001 — Personal cloud and Android assistant

- **Opened:** 2026-11-09
- **Status:** Finalized
- **Summary:** A private Android app for voice and text conversations, backed by serverless services in the user's AWS account.
- **Options and tradeoffs:** Start with push-to-talk and chat; add background features only after device and policy validation. API Gateway, Lambda, Cognito, DynamoDB, and S3 form a possible initial backend.
- **Confirmed constraints (2026-11-09):** Private installation on Android; the same account may be used on multiple personal phones. Target AWS spend was $25–$100/month; the user chose $50/month as the app's processing decision limit. Personal data and recordings should reside in AWS Asia Pacific (Mumbai), `ap-south-1`. Exact phones are not chosen yet and are expected to be recent models.
- **Confirmed constraint (2026-11-09):** English is the first supported speech/transcription language.
- **Confirmed constraint (2026-11-09):** AI inference must remain strictly in Mumbai. Cross-Region and geography inference profiles are excluded.
- **Open questions:** Exact Android devices/versions, response quality and measured usage for the selected model, offline behavior, and which device may record at a time. The $50 processing gate cannot guarantee an AWS-wide bill cap.
- **Decision:** Approved as the v1 build baseline and Phase 1 start on 2026-11-09. Rationale: the user approved the consolidated scope after choosing account, region, budget, and feature boundaries. On 2026-11-09 the user further specified Mumbai-only AI processing. On 2026-11-09 the user selected direct Mumbai Ministral 14B 3.0 for Phase 1 after account availability and published price were checked; quality remains untested. The user also chose a generated Cognito prefix, 14-day Lambda log retention, AWS-account-email $50 cost alerts, and the initial 5-cent chat reservation. After reviewing the first change set's broader generated runtime policies, the user approved an explicit role scoped to Victor's table, log group, and selected model. No new tech debt was introduced by that role choice; live IAM behavior still requires deployment testing.
- **Related tasks:** TASK-001, TASK-002, TASK-004, TASK-010.
- **Related tech debt:** DEBT-002.

### IDEA-002 — Personal knowledge graph from conversations

- **Opened:** 2026-11-09
- **Status:** Finalized
- **Summary:** Preserve conversations with Victor and extract linked people, events, places, preferences, and facts for later questions. The automatic graph-memory requirement does not cover conversations outside the app.
- **Confirmed scope (2026-11-09):** Only chats or voice conversations with the personal assistant app feed this graph by default.
- **Options and tradeoffs:** DynamoDB adjacency-list graph for modest, known queries; Neptune if complex multi-hop graph queries become necessary. Preserve source, time, confidence, corrections, and deletion controls rather than treating every utterance as a permanent verified fact.
- **Confirmed choice (2026-11-09):** Facts extracted from Victor conversations remain until the user corrects or deletes them.
- **Confirmed choices (2026-11-09):** Extracted facts enter the graph immediately, with source references and correction/deletion controls. Keep full source conversations until the user deletes them; detected password values remain in protected encrypted fields. Automatic detection can miss values.
- **Open questions:** Which facts are worth remembering, how source voice audio is retained, correction UI, conflict handling, and whether credential values are an exception to full transcript retention.
- **Decision:** Approved on 2026-11-09 as part of the v1 scope: immediate extraction from Victor conversations, source provenance, correction/deletion, and retention until deletion.
- **Related tasks:** TASK-003, TASK-009.
- **Related tech debt:** DEBT-004.

### IDEA-003 — Confidential information and step-up access

- **Opened:** 2026-11-09
- **Status:** Finalized
- **Summary:** Classify sensitive data and require an extra credential before revealing it.
- **Options and tradeoffs:** Use a passkey unlocked by device biometric or screen lock, with a fresh server challenge and authorization check. A local biometric prompt alone does not establish server-verified access; retrieval and speech paths both need enforcement. [Passkey server verification](https://developers.google.com/identity/passkeys/developer-guides/server-authentication), [Cognito step-up](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-step-up-authentication.html).
- **Confirmed choice (2026-11-09):** Passkey or biometric plus server-side check after normal sign-in.
- **Confirmed choices (2026-11-09):** Confidential categories are financial/bank-account information and passwords, including other personal passwords; no other category has been designated. After fresh authentication, Victor may speak confidential content aloud only if the user explicitly asks for spoken output. A successful passkey check unlocks confidential retrieval for 15 minutes; the backend must still validate authorization and freshness on every request.
- **Confirmed choices (2026-11-09):** Victor accepts and retains actual passwords typed into ordinary chat, including the protected full-value source message and graph property. Account numbers and financial credentials require passkey access; other financial facts do not by default. Within the existing 15-minute authorization window, Victor may speak a password only if explicitly asked. The user chose automatic detection in any chat message and does not want a required secret-entry command. Uncertain messages pause for user confirmation before AI processing. If no offline password-speaking voice is available, show the value privately instead.
- **Security issue:** Detection of unmarked password values is probabilistic and can miss values. A missed password may enter model input, logs, search, or an unprotected graph fact. AWS describes sensitive-information filters as probabilistic; transcription redaction also does not catch every instance. Proposed mitigation: run secret detection before any model call, encrypt secret spans in retained chat and graph records, mask ordinary views/search, keep model/log paths free of detected values, permit later user correction, and test on real examples. This reduces risk but cannot guarantee every unmarked password is detected. [Bedrock sensitive filters](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-sensitive-filters.html), [Transcribe redaction limits](https://docs.aws.amazon.com/transcribe/latest/dg/pii-redaction.html), [AWS Database Encryption SDK](https://docs.aws.amazon.com/database-encryption-sdk/latest/devguide/dynamodb-encryption-client.html).
- **Open technical validations:** Recovery when a phone/passkey is lost, detector error rates for ambiguous text and speech, and availability of a local offline TTS voice on the chosen phone. Confident false negatives remain possible.
- **Decision:** Approved on 2026-11-09 as part of the v1 scope. Password handling and server-verified passkey access remain a later build slice; the user accepted the known automatic-detection risk as a design gate.
- **Related tasks:** TASK-001, TASK-005.
- **Related tech debt:** DEBT-001.

### IDEA-004 — Isolated English practice

- **Opened:** 2026-11-09
- **Status:** Finalized
- **Summary:** English practice chats should not populate or retrieve the personal knowledge graph. English is also the initial transcription language for Victor and Auto Record.
- **Options and tradeoffs:** Explicit practice mode with separate storage and backend permissions is more reliable than automatic intent classification alone; classification can suggest switching modes.
- **Open questions:** Whether practice sessions are retained, what progress metrics to keep, and whether the user may explicitly save selected facts.
- **Decision:** Approved on 2026-11-09 as part of the v1 scope: separate practice storage and retrieval; sessions retained until deletion by default.
- **Related tasks:** TASK-002, TASK-004, TASK-009.
- **Related tech debt:** None known.

### IDEA-005 — User-enabled ambient recording and analysis

- **Opened:** 2026-11-09
- **Status:** Finalized
- **Summary:** When the user enables Auto Record, capture what the phone microphone can hear, including friends, meetings, and TV, then upload and run a post-processing pipeline. This is separate from automatically remembering Victor conversations.
- **Confirmed scope (2026-11-09):** User-initiated ambient microphone recording and later analysis are desired. This is microphone capture, not a promise of direct access to call or other app audio.
- **Options and tradeoffs:** A visible, user-started microphone foreground service with encrypted local segments and queued uploads fits Android's model. The OS may interrupt or silence capture, so completeness cannot be guaranteed. Continuous cloud transcription can exceed the $25–$100 budget.
- **Confirmed choices (2026-11-09):** Expect under one hour/day total across phones. Use a $50/month processing decision limit. When the monthly processing allowance is reached, queue audio and ask which recordings to process. Keep ambient findings separate from the personal graph unless manually saved. Delete raw ambient audio seven days after analysis; delete audio still unprocessed seven days after capture. Keep ambient transcripts and summaries until the user deletes them. Store personal recordings and results in `ap-south-1`. Use in India; user does not plan to inform others. English is the initial transcription language. User reports explicit company permission to record work meetings and upload audio/transcripts to personal AWS.
- **Confirmed processing priority (2026-11-09):** Transcribe speech and meetings first; process TV audio only when the user asks. Classification before transcription will be imperfect and must allow manual correction.
- **Open questions:** The seven-day queue expiry applies even if the next month's allowance has not started, so audio may be lost before processing. The scope/conditions of company permission and legal/privacy implications of unannounced recording in other settings, session limits, Wi-Fi-only uploads, and retained transcript deletion/export controls also remain open.
- **Decision:** Approved on 2026-11-09 as part of the v1 scope, subject to the listed recording-policy and device validations.
- **Related tasks:** TASK-007, TASK-010.
- **Related tech debt:** DEBT-002, DEBT-003.

### IDEA-006 — Wake phrase and battery budget

- **Opened:** 2026-11-09
- **Status:** Finalized
- **Summary:** Open the assistant by voice, ideally with “Hi Victor,” while preserving phone battery.
- **Options and tradeoffs:** Google Assistant App Actions can launch app features after the Google wake phrase. A standalone custom wake phrase may require becoming the device's selected assistant or continuous local listening, with device and battery limitations.
- **Confirmed choice (2026-11-09):** Use Google Assistant launch in the first version; evaluate standalone “Hi Victor” only after the phone is chosen.
- **Open questions:** Exact target phone and whether changing the default assistant is acceptable for a later custom wake phrase.
- **Decision:** Approved on 2026-11-09 as part of the v1 scope: Google Assistant launch first, custom wake phrase evaluated after device selection.
- **Related tasks:** TASK-008.
- **Related tech debt:** DEBT-003.

### IDEA-007 — Personal and company Gmail summaries

- **Opened:** 2026-11-09
- **Status:** Finalized
- **Summary:** With account authorization, process new email from personal and company Gmail and answer questions from essential high-level summaries to limit storage.
- **Confirmed constraints (2026-11-09):** User reports company use is permitted. Store sender, subject, date, a short summary, and action items; do not persist full bodies or attachments. This does not establish Workspace OAuth access or retention policy.
- **Options and tradeoffs:** Separate account pipelines and access boundaries; Gmail push notifications through Google Cloud Pub/Sub into AWS; metadata-only scope cannot summarize message bodies. Company policy may prohibit copying content or summaries into a personal AWS account.
- **Confirmed choice (2026-11-09):** Retain Gmail summaries for 90 days.
- **Open questions:** Exact scope of employer permission and Workspace admin OAuth policy, when the 90-day period starts, whether mail must remain separate from the personal graph, and how to handle questions that the summary cannot answer.
- **Decision:** Approved on 2026-11-09 as part of the v1 scope: separate accounts, essential summary fields only, 90-day expiry from arrival.
- **Related tasks:** TASK-006.
- **Related tech debt:** None known; Workspace OAuth/admin validation remains a task dependency.

### IDEA-008 — Occasional browser access

- **Opened:** 2026-11-09
- **Status:** Finalized
- **Summary:** Provide a simple browser page as an occasional alternative to the Android app, using the owner's AWS serverless backend.
- **Options and tradeoffs:** Serve the small page through the existing Mumbai API Gateway/Lambda to share an origin and avoid new infrastructure. Each asset incurs an API/Lambda request; S3 plus CloudFront would fit heavier use but adds resources and edge delivery.
- **Open questions:** Which desktop/mobile browsers the owner will use and whether future usage warrants separate static hosting.
- **Decision:** Owner explicitly requested creation on 2026-11-09. Implement the Phase 1 browser page with Cognito sign-in, chat modes, history, and memory review through the existing API; do not add voice or password handling before their dedicated phases. AWS update requires change-set review under `aws-requirement.md`.
- **Related tasks:** TASK-011.
- **Related tech debt:** DEBT-005.

### IDEA-009 — Show when a memory fact was added

- **Opened:** 2026-11-09
- **Status:** Finalized
- **Summary:** Display the saved creation time beside each Personal memory item so the owner can understand when it entered Victor's graph.
- **Options and tradeoffs:** Use each fact's existing UTC `createdAt` field and render it in browser-local time with a time-zone label; no data migration or extra storage is needed. Fixed IST was considered but not selected.
- **Open questions:** None for Phase 1.
- **Decision:** Owner explicitly requested the timestamp on 2026-11-09 and chose browser-local time with a zone label. Show the original added time, preserve it after correction, and keep it distinct from `updatedAt`.
- **Related tasks:** TASK-012.
- **Related tech debt:** None known.

### IDEA-010 — Separate pending review from saved memory

- **Opened:** 2026-11-09
- **Status:** Finalized
- **Summary:** A corrected or confirmed fact should leave a Pending review queue but remain available to Victor in All memory.
- **Options and tradeoffs:** A single all-facts list can mark items Reviewed but does not clear a queue. Separate Pending and All views match the owner's requested workflow. The `corrected` flag on older records can be treated as reviewed without rewriting existing data.
- **Open questions:** Whether later versions need pagination or filters when memory exceeds the current 100-fact response limit.
- **Decision:** Owner chose Pending review plus All memory and a Confirm button for unchanged facts on 2026-11-09. Correction and confirmation both mark a fact reviewed; deletion remains a separate action.
- **Related tasks:** TASK-012.
- **Related tech debt:** DEBT-006.

### IDEA-011 - Next milestone after deployed browser Phase 1

- **Opened:** 2026-11-18
- **Status:** Discussing
- **Summary:** Owner asked what should come next. Browser Phase 1 is complete; the latest memory-review controls still need owner browser verification, and Android build/device acceptance remains pending.
- **Options and tradeoffs:** Recommended: close the small browser memory check (TASK-012), then build/install and validate Android Phase 1 (TASK-001 through TASK-004). Alternative: continue browser-only improvements first, postponing the original phone milestone. In parallel after choosing scope, investigate account cost attribution and measured usage (TASK-010, DEBT-002); the November 17 account cost check was not a project-only allocation.
- **Open questions:** Owner chose Pixel 8a with Android 16 or later and a friend to build on 2026-11-18 (IDEA-012). Broader roadmap ordering and the outstanding browser acceptance check remain open; the builder must supply the Android toolchain.
- **Proposed acceptance:** Browser Confirm and Correct/Save clear Pending but retain All memory and original local-time timestamps. Android builds and installs; owner verifies sign-in, both chat modes, history, memory review/correction/deletion, Practice isolation, and sign-out/relaunch behavior. Do not mark existing tasks complete until their criteria are met.
- **Later sequence:** Measured processing costs, conversation/derived-fact deletion, confidential retrieval and voice with passkey protection, then Gmail/Auto Record/launch features subject to their recorded dependencies and owner choices.
- **Decision:** No new priority choice approved. Recommendation only; existing finalized scope and historical decisions are preserved. No implementation or repair started.
- **Related tasks:** TASK-001, TASK-002, TASK-003, TASK-004, TASK-010, TASK-012; later TASK-005 through TASK-009.
- **Related tech debt:** DEBT-001, DEBT-002, DEBT-003, DEBT-004, DEBT-006. No new implementation compromise introduced by this discussion.

### IDEA-012 - Pixel 8a and friend-built Android APK

- **Opened:** 2026-11-18
- **Status:** Finalized
- **Summary:** Build the private Android app on the owner's friend's machine and test it on Google Pixel 8a with Android 16 or later.
- **Options and tradeoffs:** Owner could install an SDK locally or delegate compilation to a friend. Friend compilation lets the owner install an APK without maintaining the Android toolchain locally; the first build and device behavior remain unverified.
- **Decision:** Owner explicitly selected Pixel 8a, Android 16+, and a friend to compile on 2026-11-18 because the owner's laptop has no Android SDK. This selects the device/build arrangement only; it does not finalize all priorities in IDEA-011 or approve build repairs.
- **Open questions:** Friend's build result and exact phone OS version/build. Future OS versions require validation when installed.
- **Actions:** Prepare a source ZIP containing only Android source, three validated public app settings, and the build handoff. Friend returns a debug APK, checksum, and build outcome; owner performs sign-in and device checks.
- **Acceptance:** TASK-004 and dependent TASK-001 through TASK-003 remain open until their build/device criteria pass. No SDK installation on the owner's laptop is required to receive/install the APK.
- **Related tasks:** TASK-004, TASK-001, TASK-002, TASK-003; device choice also informs TASK-007 and TASK-008.
- **Related tech debt:** DEBT-003 now has a chosen phone but retains recording/wake/battery validation; DEBT-007 records the missing Gradle wrapper. No new runtime compromise introduced by selecting a builder.