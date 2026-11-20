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
- **Related tech debt:** DEBT-003 now has a chosen phone but retains recording/wake/battery validation; DEBT-007 records the missing Gradle wrapper. No new runtime compromise introduced by selecting a builder.- **Updated decision (2026-11-18):** Owner clarified they will share the repository directly and only want the exact message to ask the friend to compile. This supersedes the ZIP handoff method described above; the already-created ZIP remains untouched. Device/build choice is unchanged. Because android/victor.properties is git-ignored, share that public-settings file separately. No further packaging or implementation requested.


### IDEA-013 - First interactive voice update

- **Opened:** 2026-11-18
- **Status:** Finalized
- **Summary:** Owner reports the Android app is working and asks where the voice feature is. The current source implements text chat only; voice is part of the later approved build slice and TASK-005 is still pending.
- **Evidence on 2026-11-18:** MainActivity has text input/Send and no speech capture or playback implementation; AndroidManifest currently declares only INTERNET permission.
- **Options and tradeoffs:** Recommend explicit push-to-talk for English Personal/Practice chats and spoken replies, with a visible stop control. Replies could speak automatically or require a speaker-button tap. Continuous ambient recording and a custom wake phrase remain separate later tasks (TASK-007/TASK-008).
- **Open questions:** Should ordinary replies speak automatically, or only when the owner taps a speaker button? Exact speech implementation/data path and device validation remain to be designed within the existing Mumbai/data and secret-handling constraints.
- **Historical discussion (2026-11-18):** No new voice interaction choice finalized. Prior v1 voice scope remains approved; no implementation or deployment performed in response to this status question.
- **Acceptance to define:** Microphone permission/cancel/error behavior, transcript handling, reply playback/stop, both modes remaining isolated, and Pixel 8a Android 16 validation. Classified speech remains subject to the existing server-verified passkey/offline-voice requirements; current Phase 1 does not support confidential retrieval.
- **Related tasks:** TASK-005; TASK-004 device acceptance remains in progress; TASK-007/TASK-008 are separate later features.
- **Related tech debt:** DEBT-001, DEBT-003. No new implementation compromise introduced by this discussion.

- **Decision update (2026-11-19):** Owner said go ahead with voice on Android and web, requested research/selection of products, and delegated routine product choice. Owner first reaffirmed Mumbai-only processing, then explicitly allowed Sarvam after requesting SDK review. Select Sarvam hosted Model APIs (Saaras v4 realtime STT, Bulbul v4 Flash TTS), with an authenticated shared gateway and the existing Mumbai reasoning/memory backend. This is a speech-provider exception to the earlier Mumbai-only constraint; no Mumbai-specific guarantee is claimed for Sarvam. Prior constraints and discussion above remain historical context.
- **Rationale and interaction:** Use the official JavaScript server SDK instead of training speech models or rewriting Kotlin in Flutter. Continuous foreground voice sessions have live transcripts, automatic ordinary spoken replies, mute/stop/interruption controls, and a five-minute server limit. Secret retrieval and confidential speech remain unimplemented. Default automatic replies follow the delegated choice; no synthetic voice quality verdict has been inferred from documentation.
- **Research and implementation:** See docs/voice-research-2026-11-19.md and voice-gateway/README.md. Source is prepared for Android/web/gateway/backend; local tests and packaging pass. Sarvam key/retention setup, hosting review/deployment, live quality/latency tests, and the updated Android build remain pending. No voice feature is deployed.
- **Related tasks update:** TASK-013 for ordinary interactive voice; TASK-005 retains confidential retrieval/passkey work. TASK-004 device acceptance remains separate.
- **Related tech debt update:** DEBT-002 (estimated shared allowance), DEBT-008 (full model response before speech), DEBT-009 (single-process connection coordination), plus existing DEBT-001/003. Hosting/credentials/live tests are task dependencies, not completed work.


### IDEA-014 - API Gateway and on-demand Lambda voice hosting

- **Opened:** 2026-11-20
- **Status:** Discussing
- **Summary:** Owner asks why API Gateway cannot be used instead of an EC2 instance. EC2 is not mandatory; the earlier proposal focused too narrowly on hosting the already-written persistent server.
- **Options and tradeoffs:** Keep the current persistent streaming server (simpler sockets and buffering but fixed hosting cost), or prototype API Gateway WebSocket APIs with short message handlers, a session-bound ordered buffer and an asynchronously invoked active-session Lambda worker (no always-on server, more coordination and potential latency). Existing text HTTP API remains usable in both cases.
- **Evidence:** Official AWS docs allow two-hour client WebSocket connections but cap each integration at 29 seconds; standard Lambda invocation max is 15 minutes. A five-minute voice worker is possible if separately invoked. Binary audio frames must become base64 text/JSON; state must not rely on sharing Lambda execution environments. New Lambda Web Functions do not accept WebSocket upgrades either.
- **Open questions:** Prototype viability and measured latency/cost; audio buffer/lease/cleanup design; final architecture choice. Owner has not approved existing-server reuse or a deployment.
- **Recommendation:** Prototype the API Gateway/on-demand option before committing to a new always-on host, given intermittent personal usage. This is a recommendation, not a claim that the current server can be deployed unchanged to API Gateway.
- **Decision:** Pending explicit architecture choice. Keep the prior Sarvam provider decision; do not mark deployment complete.
- **Related tasks:** TASK-013; TASK-005 confidential retrieval remains separate.
- **Related tech debt:** DEBT-008 (model response buffering), DEBT-009 (current in-process session coordination); new transport limitations are prototype acceptance items.
- **Reference:** docs/voice-api-gateway-option.md.

- **IDEA-013 setup update (2026-11-20):** Owner confirmed Model APIs zero-day retention. This prerequisite is owner-confirmed, not independently inspected. Root key was already verified by synthetic test. Hosting is now under API Gateway/on-demand review (IDEA-014); existing-instance reuse is not approved. No personal microphone test or deployment performed.

### IDEA-015 - Docker/MongoDB SaaS replacement

- **Opened:** 2026-11-20
- **Status:** Finalized on 2026-11-20 by explicit approval in prompt 007; implementation and acceptance are tracked separately.
- **Summary:** Replace the single-owner serverless deployment with Docker/Compose and MongoDB, develop on localhost, later deploy to owner-supplied EC2 behind ALB/domain. Plan first, ask questions, and identify security/maintenance issues.
- **Confirmed direction:** No CloudFormation/serverless hosting in the replacement. Dockerfiles/Compose and `.env`/`.env.example`/`.env.dev` are requested for implementation; no files with real settings are created or overwritten during planning. Public free signup with private personal accounts only; web and Android together. Existing Pixel 8a Android 16+/friend build choice continues.
- **Decisions (2026-11-20):** Owner explicitly selected permanent deletion of old chats/memory (no export/migration); replace security questions with verified-email recovery/recovery codes; password login with email OTP only at registration/recovery; public free access with usage limits. Limits approved: 20 chat turns and 5 voice minutes per verified user/day, one active voice session/user, $50/month application AI guard with billing-lag caveat. SES SMTP Mumbai selected for production. Source: prompts 2026-11-20-003 through 005.
- **Provider clarification:** Owner intends to supply a ChatGPT key. Plan for an OpenAI API key only after clarifying replacement of Bedrock and the earlier Mumbai-only reasoning rule. Sarvam speech and owner-confirmed zero-day Model APIs retention remain prior approved choices. No key requested in chat or API call made.
- **Options and recommendation:** Consolidate Python domain behavior and existing Node speech into one modular TypeScript/Node backend; reuse browser UI and Kotlin; Nginx, MongoDB, Redis plus dev-only Mailpit. Alternative retains separate Python/Node services and avoids some porting but keeps two runtime/auth boundaries. Proposed maintained auth library: Better Auth; validate native sessions, OTP, indexes/transactions and recovery-code support before adoption. Single-host Compose is simpler but has downtime and operational tradeoffs.
- **Open questions:** OpenAI processing location/privacy and final architecture choice; later host/domain/ALB details, verified SMTP sender/production access, recovery targets and representative load. No EC2 reuse, DNS/listener change or deployment assumed.
- **Security findings:** Tenant-scope every query/cache/job/voice stream; verified-email gating; OTP replay/rate limits and protected storage; session revocation across sockets; public-signup/email/model abuse; per-user and global admission controls; no public database ports or client/build-layer secrets. Same-EC2 state is a single failure domain; off-host encrypted backups and restore tests are release requirements for new SaaS data. See the plan for the full threat/release matrix.
- **Retirement evidence:** Read-only AWS inventory found 17 live Victor resources and a SAM support stack. Processed deployed template confirms retained table and budget. Inventory backup/PITR/log/artifact copies before executing deletion; check SAM ownership and preserve unrelated workloads. No deletion in this plan-first turn.
- **Prior decisions preserved:** This owner direction supersedes further implementation of the serverless option in IDEA-014 and the Cognito/Lambda hosting assumptions of IDEA-013. These are historical decisions, not completed migrations. Retain the approved Sarvam interaction goals; prior source is not discarded. TASK-013 needs the replacement auth/backend rather than the earlier gateway deployment.
- **Related tasks:** TASK-014 through TASK-017; TASK-004/TASK-013 client and voice acceptance; TASK-009 deletion behavior and TASK-010 usage accounting remain relevant.
- **Related tech debt:** DEBT-001/002/006/007/008/009 remain open; DEBT-010 records the proposed single-host operating compromise. No new runtime debt introduced by documentation alone.
- **Reference:** [Docker/MongoDB SaaS plan](../docs/docker-mongodb-saas-plan.md); [planning prompt](../prompts/2026-11-20-002-docker-mongodb-saas-plan.md).

- **IDEA-015 provider decision update (2026-11-20):** In prompt 2026-11-20-006 the owner explicitly selected OpenAI chat/memory plus Sarvam speech and allowed processing outside Mumbai. This supersedes the earlier Mumbai-only reasoning rule; prior decisions remain historical. Use an OpenAI API key/billing, not a ChatGPT subscription credential. Model selection and account/endpoint retention controls remain implementation checks, not a renewed provider/location question. Full consolidation/Compose plan remains Discussing until owner review.

- **IDEA-015 finalized (2026-11-20, prompt 007):** Owner said "yep. go ahead" to the consolidated TypeScript backend and proposed sequence. Status is now **Finalized** for that design and sequence. Implement local Docker/auth/isolation/product checks, then permanently retire exact old project AWS resources, then deploy to supplied EC2/ALB/domain. Earlier serverless discussion is superseded, with its source/evidence preserved. TASK-014/015 implementation is in progress; TASK-016 waits for local proof and exact resource ownership checks; TASK-017 still requires access/domain. DEBT-010 is an accepted initial single-host compromise, subject to backups/restore and explicit production limitations; DEBT-001/002/007/008/009 remain follow-ups until their criteria are met.
