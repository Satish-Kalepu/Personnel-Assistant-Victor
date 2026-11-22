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

- **IDEA-015 stage decisions/evidence (2026-11-21):** Owner supplied the EC2, verified its SSH host fingerprint, authorized GitHub push/pull, and explicitly kept existing MongoDB/security rules unchanged (prompts 001 through 005). Private stage is running with new unpublished databases and real-provider fixture checks; old deployment retirement is complete. Owner then supplied https://ai_test.satishk.com (prompt 006), which currently routes through existing host Nginx rather than ALB. HTTPS-origin/cookie/proxy changes are under scoped review; real SMTP, domain acceptance, friend APK, device quality, production backup/recovery and host operating follow-ups remain open. Prior ALB proposal is preserved; no ALB created or presumed necessary for the supplied direct-proxy route. See TASK-017 and DEBT-010/011.

- **2026-11-21 HTTPS stage follow-up (IDEA-015/TASK-017):** Owner supplied ai_test.satishk.com and SMTP, then chose manual Nginx editing (prompts 006?008). Dedicated app is now production-mode with exact HTTPS origin/Secure cookies and real SMTP; TLS/authentication checks passed from EC2 and operator, no email sent. Supplied endpoint is AWS Mail Manager rather than the earlier planned Mumbai SES SMTP endpoint. DNS uses direct host Nginx, so no ALB was created. Proposed domain-only voice/client-IP location blocks passed isolated host-binary syntax check. Manual host application, actual inbox delivery/suppression and browser/Pixel voice acceptance remain open; no unrelated host repair performed.
- **Voice research follow-up (2026-11-21):** Owner requested a staged scientific comparison of all relevant voice ecosystems. See IDEA-016; this does not replace the implemented provider decision.

### IDEA-016 - Fastest natural individual voice conversation

- **Opened:** 2026-11-21.
- **Status:** Discussing.
- **Summary:** Research mobile/web architectures that stream listening, reasoning and speech with natural interruptions and minimal useful-response delay. Owner explicitly prioritizes best individual experience without a monthly-budget cutoff; cost is informational.
- **Options:** Native speech/reasoning/speech; full-duplex voice with asynchronous backend reasoning; fully streaming specialist STT/LLM/TTS; hybrid local controls and cloud intelligence; fully local models as a separate experiment.
- **Open questions:** Measured winner on Pixel 8a and target networks, acceptable voice/accent and pause behavior, exact provider/account availability, transcript/control tradeoffs, and whether to approve an implementation/paid benchmark after desk research.
- **Decision:** Research priority approved in prompts 011 and 012; provider/architecture selection remains pending. Existing OpenAI + Sarvam implementation and historical choices are preserved.
- **Research:** [Study protocol](../research/voice-chatbot-2026-11-21/00-study-protocol.md); [main prompt](../prompts/2026-11-21-010-realtime-voice-architecture-research.md).
- **Related tasks/debt:** TASK-013 and DEBT-008 provide existing voice context. No new implementation task is finalized and no new runtime compromise is introduced by research.
- **Research result (2026-11-21):** Twelve-file study and 83-entry source register completed under research/voice-chatbot-2026-11-21. First-prototype recommendation: GPT-Live 1.1/WebRTC with an independent backend; compare Gemini 3.8 Live, Realtime 2.1 and a tuned LiveKit/Flux/streaming-LLM/Sonic cascade, plus AWS/Azure/ElevenLabs challengers. This is a proposal based on documented fit, not a measured winner or approved provider replacement.
- **Validation and next gate:** Document/link/JSON checks passed; 30 scenario definitions and acoustic benchmark protocol prepared. No paid/device/listening experiments or runtime changes. Owner architecture choice and subsequent empirical work remain open; status stays Discussing and no existing task/debt is marked complete.
- **Planning/demo update (2026-11-21, prompts 013–015):** Two concrete plans proposed: A is direct OpenAI Live/WebRTC with backend delegation; B is LiveKit web/Android SDKs with a Node/Gemini voice worker and the shared domain backend. Owner authorized local demo screens/testing, not a final architecture or production migration. Responsive lab and five focused checks completed; OpenAI audio transport and synthetic-track browser WebRTC connected. After explicit consent, corrected first-chunk timing and preserved the invalid original report. Answer correctness/useful-answer latency remain unscored because the synthetic speech transcript was incomplete; Gemini/LiveKit setup and physical Pixel/audio preference trials remain open. See [plans](../research/voice-chatbot-2026-11-21/08-two-architecture-plans.md) and [test evidence](../research/voice-chatbot-2026-11-21/09-demo-test-report.md). Status remains Discussing; existing debt/task completion is unchanged.
- **Provider setup (2026-11-21, prompt 016):** Owner invited requests for missing access. Existing OpenAI key already supports initial tests. Asked for a private LiveKit project configuration and optional Google API key; Gemini through LiveKit Inference needs no separate Google key. Current Build plan can start without a monthly subscription purchase; actual credits/quota/model access must be checked. Setup selection/readiness pending; no keys copied to chat/docs and no account or subscription changes.
### IDEA-017 - Own realtime voice gateway and backend turn detection

- **Opened:** 2026-11-21.
- **Status:** Discussing.
- **Summary:** Owner asks whether an owned server can receive continuous live audio, detect speech start/end, and drive the backend agent, and whether this is a WebRTC server.
- **Options and tradeoffs:** Own media transport plus VAD/turn orchestration while retaining hosted AI models; self-host more speech/model inference; retain direct native-provider media. A WebRTC media server handles transport, while a voice worker handles speech/turn detection and agent coordination. Control/portability improve, but an extra route and operating responsibilities can affect latency.
- **Recommendation:** Evaluate a self-hosted LiveKit media layer with an owned worker, pretrained Silero VAD and a compatible semantic/acoustic turn detector. Stream STT concurrently for text-based agents; do not wait for a complete audio clip or reconnect the agent for every utterance. Native audio remains a separate adapter path.
- **Open questions:** Own transport/turn logic only versus speech/model inference too; worker/runtime compatibility, client/backend interruption split, network/echo behavior and measured speed/false-end rates.
- **Decision:** No implementation/provider/self-hosting selection approved. New discussion supplements IDEA-016 and the two plans without superseding either. No new runtime compromise introduced.
- **References:** [Architecture note](../research/voice-chatbot-2026-11-21/11-own-realtime-voice-server.md), [prompt 017](../prompts/2026-11-21-017-own-realtime-voice-server.md). Related voice context: TASK-013/DEBT-008; no new task finalized.
- **POC decision (2026-11-21, prompt 018):** Owner explicitly said to build a POC first. Finalized for an isolated local proof of owned live-audio reception, backend VAD/endpoint events and agent integration; production architecture/provider/self-hosting rollout remains Discussing. Use the smallest actual WebRTC endpoint plus pretrained local VAD for this proof; a hosted LiveKit subscription is not a prerequisite. Implementation and measured evidence tracked in TASK-018; prototype-only compromises in DEBT-012. Existing plans and decisions remain historical context.
- **POC findings (2026-11-21):** Isolated Python aiortc / Silero ONNX worker and web screen built. Seven core checks and actual Python local/cloud WebRTC synthetic speech tests passed, including complete transcript, correct 156 answer and decoded non-silent audio. One cloud run took 3941 ms endpoint → first server PCM, excluding 640 ms endpoint wait/device playback; not yet a natural-conversation speed result. Browser synthetic replay starts speech detection but lacks trailing silence; correction consent requested separately. [Experiment report](../research/voice-chatbot-2026-11-21/12-owned-server-poc-report.md). No production/provider migration approved.
- **Integration decision (2026-11-21, prompt 020):** Owner explicitly approved the trailing-silence correction, staging hosting and immediate app integration. Finalized for a staging integration of owned backend VAD/turn detection with the existing authenticated app/backend. First staging increment keeps web/Android WSS PCM transport and backend-owned account/mode/memory/checked-reply policy; private Silero worker supplies manual STT boundaries. Public WebRTC/TURN and full streaming-LLM changes remain separate options. No unrelated host/security-rule change. TASK-019 tracks rollout/verification; DEBT-012 retains prototype/device/performance limits. Prior local-only and provider-default states are preserved above.
- **Staging result (2026-11-21, prompts020–021):** Deployed stage-owned-ace419520ce9 at https://ai_test.satishk.com.28 isolated app tests and3 worker tests passed; complete public synthetic STT/agent/TTS and browser worklet/mute/Stop/auth controls passed. One final-input-chunk → first-PCM3978ms observation is not acoustic or acceptable-speed evidence. Both new worker frame-limit defect and existing web mute mismatch were explained, explicitly approved, corrected, rebuilt/redeployed and checked; initial failure retained. Synthetic account removed, no email sent. TASK-018/019 complete only for their stated prototype/staging increment. [Report](../research/voice-chatbot-2026-11-21/13-staging-owned-voice-integration.md); final production/provider/performance selection remains Discussing.
- **Paused-facts finding and repair decision (2026-11-22, prompts001–002):** Owner reports smooth conversation but lost earlier facts across pauses. Local synthetic reproduction confirmed delayed final transcripts were discarded when a new utterance began, and reply cancellation also aborted input processing before fact/history storage. Explained both paths and received explicit consent to preserve ordered input independently of reply cancellation, verify duplicates/corrections, and redeploy staging. Finalized for this scoped repair;640ms endpoint retained. TASK-020 tracks acceptance, DEBT-012 retains broader limits; production architecture selection remains Discussing. Input/model work already accepted may finish after a speech interruption, while its superseded reply is suppressed; stop/logout still cancel it.
- **Paused-facts repair result (2026-11-22, prompts002–003):** Stage-owned-4becaff17ef6 deployed/healthy;35 tests passed including real DB retention. First live checker timed out despite all three facts/history saved; separate checker correction was explained/approved, then a fresh empty account passed three900ms-separated speech segments, all three facts/history and nonzero204480-byte PCM. Both synthetic fixtures removed, global spend/real accounts preserved, no email. TASK-020 complete for repair scope. [Report14](../research/voice-chatbot-2026-11-21/14-paused-facts-retention-repair.md); session/reconnect, extraction/context limits, physical acceptance and general architecture remain open under DEBT-012.

### IDEA-018 - Single agent inbox across new speech and tool results

- **Opened:** 2026-11-22.
- **Status:** Discussing.
- **Summary:** Owner asks whether incoming statements join the active agent’s next loop alongside tool results, without duplicate agents, or are queued for a combined answer.
- **Current evidence:** The repaired voice session serializes input batches and retains new statements; the model makes one structured reply/facts call per batch. There is no LLM-directed tool execution loop or explicit guarantee that the last reply summarizes every statement. Earlier saved context is supplied to later batches.
- **Options:** Keep serial queue and add explicit combined-response coverage; introduce one logical conversation coordinator with an ordered inbox, tool-result correlation and replanning at step boundaries. Recommend the latter when actual multi-step tools are added, with authorized/idempotent actions and correction/cancellation checks before dispatch.
- **Open questions:** Tool scope and side effects, summary/acknowledgement policy, durable conversation ownership/reconnect, and handling instructions conflicting with pending/completed actions.
- **Decision:** No implementation choice or deployment approval inferred from this question. Existing TASK-020 remains complete for input retention only; no new task finalized. Design gap recorded under DEBT-012.
- **References:** [Audit/design note15](../research/voice-chatbot-2026-11-21/15-single-agent-input-and-tool-loop.md), [prompt004](../prompts/2026-11-22-004-check-single-agent-input-loop.md); related IDEA-017/DEBT-012.

### IDEA-019 - Git-native staging releases and scoped sudo

- **Opened:** 2026-11-22.
- **Status:** Finalized by explicit owner instruction in prompt005.
- **Summary / decision:** Application code moves through reviewed commits, non-force Stage push, fast-forward pull of the expected commit and staging-side image builds. Retire routine workstation image/archive/env copying. Keep private env/user data on staging, outside Git. Request scoped sudo only when an actual authorized host operation requires it; do not work around privileges through artifact copying.
- **Options considered:** Prior local image transfer is preserved as historical deployment evidence; owner explicitly selects Git-native releases going forward. Existing unprivileged app Git/Docker access is adequate for the current path.
- **Rationale / open questions:** Owner-selected maintainability/provenance workflow; validate current remote build/smoke/health path. No blanket sudo authorization or unrelated host change inferred.
- **Tasks/debt:** TASK-021. Existing DEBT-011/012 operating/device limits remain; no new host privilege compromise introduced. [Runbook](../docs/git-stage-deployment.md).
- **Scope clarification (2026-11-22, prompt007):** Both existing host Nginx (HTTPS/domain routing to loopback18080) and web-container Nginx (frontend/static/API/WSS routing on8080) are used. The pending public-asset ownership fix is inside the web image; it needs no host Nginx edit/reload or sudo. User’s clarification question is not repair consent; broader asset repair remains pending.

### IDEA-020 - Serve frontend directly from existing host Nginx

- **Opened:** 2026-11-22.
- **Status:** Discussing; owner prefers removing the web-container Nginx and asks for host settings. Concrete migration/cutover not approved or activated by the configuration question alone.
- **Summary:** Use existing host Nginx for TLS, public static assets and direct API/voice proxying; keep API, voice worker and databases containerized.
- **Recommended layout:** Public commit-versioned assets under /srv/victor-web/current; direct API loopback127.0.0.1:18081→3000; preserve current app until assets/API readiness, manual site-only Nginx edit/test/reload and public voice acceptance succeed. Publish assets from staging Git builds with normalized readable modes, not the private checkout or workstation artifacts.
- **Options / tradeoffs:** Host-only removes a proxy/image serving layer but adds coordinated host asset/API release management and one-time privileged directory/site setup. Fixing container ownership remains a separate alternative; do not pursue it while owner evaluates the host-only replacement.
- **Open questions:** Approval of the concrete migration sequence, one-time scoped sudo/public-root setup and owner application of the reviewed site fragment; implementation and rollback for atomic frontend/API releases.
- **References:** [Host-only proposal](../docs/host-nginx-migration.md), [Nginx fragment](../deploy/nginx/ai_test.host-only.conf), [prompt008](../prompts/2026-11-22-008-plan-host-nginx-only.md). TASK-021 stays In progress for deployment acceptance; no new implementation task finalized. DEBT-011/012 host/voice limits remain, no new operating compromise deployed.
- **Laptop clarification (2026-11-22, prompt009):** Proposed local mode uses Vite5173 with same-origin HTTP/WS proxies plus Docker backend/voice/data/Mailpit, so no laptop Nginx installation. Current documented local Compose mode still contains Nginx; existing Vite dev script has no proxy/API-port overlay yet. Additional configuration/APP_ORIGIN alignment is needed before presenting the no-Nginx local mode as runnable. Explanation only; no implementation selection inferred.

- **IDEA-020 superseded (2026-11-22, prompt010):** Owner explicitly abandons host-only serving and chooses container Nginx with a published frontend mount. Preserve the above proposal as historical; do not activate its direct API port/site fragment or proposed Vite-only mode. See IDEA-021.

### IDEA-021 - One Compose file and container Nginx with published frontend

- **Opened / finalized:** 2026-11-22 by explicit owner direction in prompt010.
- **Status:** Finalized for implementation; staging acceptance tracked separately.
- **Summary / decision:** One readable root docker-compose.yml; external ALB/host Nginx handles server TLS, web-container Nginx serves read-only /srv/victor-web/current and proxies private API/WebSocket services. Laptop uses the same container with web/dist. Remove environment overlay chains while retaining isolated test/restore overrides and optional local-mail/owned-voice profiles.
- **Options:** Prior host-only proposal and Vite development proxy are superseded by the owner's chosen portable container layout. Original static-assets-in-image alternative remains historical.
- **Rationale:** Explicit maintainability/portability preference and one application ingress/routing configuration across environments. Keep Git push/pull and server-side public build publication; preserve private env/data and existing volume/project names.
- **Open questions:** Scoped sudo creation of the dedicated /srv public root, staging rollout and public acceptance. No host TLS change is required for the existing proxy route; future ALB source CIDR/ingress remains environment-specific.
- **Tasks / debt:** TASK-022, TASK-021; DEBT-013 records asset/API rollout coupling and single-host interruption. Existing DEBT-011/012 remain. [Runbook](../docs/compose-deployment.md), [prompt010](../prompts/2026-11-22-010-simplify-compose-container-nginx.md).

- **IDEA-021 staging authorization (2026-11-22, prompt014):** Owner explicitly says to update staging. Proceed with reviewed Git push/pull and server builds; existing app/data/TLS retained. Read-only check confirms dedicated public-root absent and no passwordless sudo, so request exactly the documented directory creation when needed. TASK-022/021 remain in progress until rollout and public acceptance.

- **IDEA-021 publication path changed/finalized (2026-11-22, prompt015):** Owner explicitly cancels /srv/root-directory setup; public assets must stay in the designated codebase. Use repository/deploy/.local/web/releases and current, an ignored app-owned subtree; mount only current read-only. Preserve the prior /srv decision above as superseded history. Guard canonical paths, normalize public-file modes, retain private parent permissions and record the absolute checkout-local mount source in server env. No sudo or host TLS change is needed for this path. TASK-022/021 deployment continues under existing authorization.

- **IDEA-021 staging result (2026-11-22, prompts014/015):** Selected repository-local/container-Nginx design deployed as stage-git-f2f0646806e4-20261122111218, commitf2f0646.10 local routing groups,18 server voice checks, actual read-only mount/public assets/auth controls and fresh synthetic STT/LLM/TTS passed; fixture removed. Git checkout/private parents remain0700, public files0644; original DB container IDs/start times retained. No /srv, sudo, host TLS edit or workstation env/data transfer. TASK-021/022 complete for scoped deployment; DEBT-013 coordinated rollback/device/production follow-ups stay open.

### IDEA-023 - Retain primary env outside the checkout

- **Opened / finalized:** 2026-11-22, explicit owner choice in prompt021.
- **Status:** Finalized for parent ../PersonnelAssistant.env; migration acceptance tracked separately.
- **Summary / decision:** Keep environment-specific credentials/settings in the repo parent. Consolidate laptop .env.dev + .env with identical old precedence; use one explicit Compose --env-file argument. On staging relocate its existing server-only file and retain an outside-checkout compatibility symlink for prior releases. No laptop-to-server credential transfer.
- **Options / rationale:** Prior ignored in-repo local files and staging shared/.env remain history. Parent file survives checkout replacement and simplifies startup; canonical path explicitly chosen by owner.
- **Acceptance:** Complete2026-11-22 through prompts021/022. Approved guard correction verified; all29 local values/Compose unchanged, exact old bytes archived outside repo; commitf5418ea pushed/pulled, staging parent0600 and full Compose equal. All five running container IDs/start times and readiness unchanged. No new open architecture question.
- **Task / debt:** TASK-024; no new runtime compromise selected. Preserve private permissions and existing backup/restore responsibilities under DEBT-010/011. Exact legacy local bytes archived beside the canonical parent file, not in Git.

### IDEA-024 - Separate press-to-speak and live conversation controls

- **Opened:**2026-11-22, prompt024.
- **Status:** Finalized for the explicitly requested two controls and distinct live theme; press interaction uses a stated hold/release implementation assumption after optional clarification grace, pending owner preference feedback.
- **Summary / decision:** Frontend chat offers a single held message and a continuous hands-free live session. Live mode visibly changes the whole screen theme, shows microphone/session state and a clear exit. Backend identity/memory/usage/checked-TTS remain authoritative.
- **Options / open questions:** Asked hold/release versus dictation/tap-to-finish; no answer yet, proceeded visibly with recommended hold/release. Hold connects private streaming manual STT, release flushes final partial PCM, closes microphone and ends the utterance, then waits for the checked reply/audio completion. Live retains owned Silero endpointing and interruptions.
- **Tasks / debt:** TASK-025; DEBT-012 existing voice/device limits remain. First use may require microphone permission/connection; UI says wait for Listening. No measured latency improvement or physical-device acceptance claimed.
