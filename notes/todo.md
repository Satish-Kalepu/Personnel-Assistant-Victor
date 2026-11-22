# To do

Tasks created from the v1 scope approved on 2026-11-09. Completion means the stated check passes; a local scaffold is not a deployed feature.

## Pending

### TASK-001 — Private identity and API boundary
- **Source:** IDEA-001, IDEA-003
- **Priority / dependencies:** P0; AWS account and domain settings required for deployment.
- **Completion criteria:** Cognito sign-in on a private Android install; API rejects unauthenticated access and scopes all data to the authenticated subject.
- **Status:** In progress; the scoped-role backend stack is deployed, unauthenticated API requests returned 401, and the private Cognito user is `CONFIRMED`. Authenticated Android sign-in and owner isolation remain untested.

### TASK-002 — Text chat and mode isolation
- **Source:** IDEA-001, IDEA-004
- **Priority / dependencies:** P0; TASK-001.
- **Completion criteria:** Personal and English Practice chats work and remain separate in storage and model context; a signed-out phone cannot read either.
- **Status:** In progress; direct synthetic Lambda invocations returned replies for both modes and stored separate messages. Authenticated API and Android device behavior remain untested.

### TASK-003 — Immediate personal memory and review
- **Source:** IDEA-002, IDEA-003
- **Priority / dependencies:** P0; TASK-002.
- **Completion criteria:** Extracted personal facts retain source/time/confidence, appear in review immediately, and can be corrected/deleted. Practice never reads or writes them.
- **Status:** In progress; direct synthetic Lambda test stored one Personal fact and none from Practice. Live fact review/correction on Android remains untested.

### TASK-004 — Android Phase 1 client
- **Source:** IDEA-001, IDEA-002, IDEA-004
- **Priority / dependencies:** P0; TASK-001 to TASK-003.
- **Completion criteria:** Android build and device test of sign-in, text chat, mode switching, history, and memory review.
- **Status:** In progress; owner chose Google Pixel 8a with Android 16 or later and a friend to compile (IDEA-012, 2026-11-18). Owner has no local Android SDK. Source/config handoff and build/device checklist are in `docs/android-build-handoff.md`; deliver a debug APK, checksum, and build result, then perform the stated device checks. Owner reports the app is working on 2026-11-18; this is user-reported build/install/use success. Individual sign-in, mode isolation, history, memory, and sign-out/relaunch acceptance results have not all been confirmed, so the task remains in progress.

### TASK-005 — Confidential retrieval and voice chat
- **Source:** IDEA-003
- **Priority / dependencies:** P0; Phase 1 and target phone.
- **Completion criteria:** Server-verified passkey step-up protects classified retrieval and explicit offline speech for 15 minutes; detected secrets never reach model input.
- **Status:** In progress for the ordinary voice subset via TASK-013/IDEA-013 (2026-11-19). Android/web/Sarvam gateway source is prepared and local checks pass; no live voice deployment. Confidential retrieval, server-verified passkey authorization, and offline secret speech remain unimplemented.

### TASK-006 — Separate Gmail summaries
- **Source:** IDEA-007
- **Priority / dependencies:** P1; Workspace OAuth approval.
- **Completion criteria:** Both accounts ingest only approved summary fields, preserve boundaries, and expire records after 90 days.
- **Status:** Pending

### TASK-007 — Auto Record and processing
- **Source:** IDEA-005
- **Priority / dependencies:** P1; target phone, recording-policy review, TASK-005.
- **Completion criteria:** Explicit visible recording, queued encrypted upload, prioritization, manual graph save, $50 processing gate, and seven-day raw-audio deletion tested on device.
- **Status:** Pending

### TASK-008 — Assistant launch and battery validation
- **Source:** IDEA-006
- **Priority / dependencies:** P1; target phone and installed app.
- **Completion criteria:** Google Assistant launches Victor; battery and recording-interruption behavior measured; custom wake phrase evaluated.
- **Status:** Pending

### TASK-009 — Source conversation deletion and retention controls
- **Source:** IDEA-002, IDEA-004
- **Priority / dependencies:** P1; TASK-002 and TASK-003.
- **Completion criteria:** Owner can delete a conversation and its derived facts, including cross-device copies; practice sessions can also be deleted.
- **Status:** Pending

### TASK-010 — Chat cost allowance before deployment
- **Source:** IDEA-001, IDEA-005
- **Priority / dependencies:** P0; TASK-002 and a selected Mumbai model.
- **Completion criteria:** Per-user monthly model usage is metered and held at the approved processing allowance across phones; AWS budget alerts provide a separate warning.
- **Status:** In progress: atomic chat reservations are coded; direct Mumbai Ministral 14B is deployed; a $50 account-wide AWS Budget with email notifications is deployed. The owner kept the 5-cent initial reserve. Measured usage and future jobs remain.

### TASK-012 — Memory list refresh and added timestamp
- **Source:** IDEA-009, IDEA-010; prompts `2026-11-09-052-memory-confirm-and-timestamp.md` and `2026-11-09-053-memory-review-decision.md`.
- **Priority / dependencies:** P1; live browser client and reviewed AWS update.
- **Completion criteria:** Correct/Save and Confirm remove a fact from Pending review while retaining it in All memory and Victor's graph; each item shows its original added date/time in browser-local time with a zone label; the owner verifies the live behavior.
- **Status:** In progress; owner-approved change set `samcli-deploy1794246063` deployed. New page assets return 200, Lambda is Active, unsigned `/facts` returns 401, and isolated live Lambda tests passed for Confirm and correction with test records removed. Owner verification of the browser queue and local timestamps remains.

### TASK-013 - Interactive Sarvam voice on Android and web
- **Source:** IDEA-013; prompts 2026-11-19-001 through 2026-11-19-006.
- **Priority / dependencies:** P0; working Cognito/text backend, Sarvam key and Model APIs zero-retention setup, reviewed persistent gateway hosting/deployment, rebuilt Pixel 8a app.
- **Completion criteria:** Both clients have live English transcripts, ordinary automatic spoken replies, mute/stop and interruption controls; mode/session changes stop capture and stale playback. Cognito ownership, existing secret holds, and shared allowance remain enforced. Verify provider formats/account access and real device/browser audio; measure latency against the targets in docs/voice-research-2026-11-19.md and obtain owner acceptance. No confidential speech, ambient recording, or wake phrase is implied.
- **Status:** In progress; source implementation, 20 backend tests, eleven gateway tests, web voice/memory checks, SAM build/lint, and local Docker build/health/invalid-token checks passed. A real synthetic Sarvam STT/TTS check passed (692ms connect-to-first-PCM, 4.02s sample; not a full conversation benchmark). Android SDK/build and real Pixel/browser measurements remain pending. Owner provided the key privately in root .env; no key is embedded in clients or source. No AWS resources or live web update deployed. Owner confirmed zero-day Model APIs retention on 2026-11-20; no repeated confirmation needed. API Gateway/on-demand hosting option is under discussion (IDEA-014). Host/architecture choice, prototype if selected, deployment approval and device testing remain. See docs/voice-deployment-review.md.

## Completed

### TASK-011 — Occasional browser client
- **Source:** IDEA-008
- **Priority / dependencies:** P1; deployed Phase 1 API and Cognito sign-in.
- **Completion criteria:** Browser page loads over HTTPS, completes Cognito PKCE sign-in, sends Personal and Practice chats separately, reviews/corrects/deletes Personal facts, and signed-out data calls remain rejected.
- **Status:** Complete on 2026-11-09. Live page/assets returned 200, Cognito accepted the callback, and signed-out chat/memory requests returned 401. Owner reports successful sign-in, replies in both modes, a Personal memory edit and deletion, and sign-out with sign-in required on reload.


### TASK-014 - Docker/Compose and MongoDB replacement foundation
- **Source:** IDEA-015; prompts 2026-11-20-002 through 005.
- **Priority / dependencies:** P0; owner reviews the proposed backend architecture and sequence. Docker/MongoDB/local-to-EC2 direction and OpenAI/Sarvam with outside-Mumbai processing are explicitly chosen; implementation waits for plan review.
- **Completion criteria:** API/web images build from a clean checkout; Compose starts localhost UI/API/voice, authenticated private MongoDB/Redis and dev-only Mailpit; persistent state survives restart. Tracked `.env.example`, ignored `.env.dev`/operator `.env`, validated allowlisted settings, no secrets in build contexts/assets/images. Production overrides exclude dev services. Preserve existing uncommitted work and root Sarvam key; update active docs away from SAM after replacement acceptance.
- **Status:** Complete locally on 2026-11-21. Dockerfiles/common/dev/prod/test/restore/private-stage overrides and safe env initializers are implemented. Clean image builds, 27 integration/protocol tests, indexed pagination checks, secret-value scans, anonymous-access checks and an authenticated cold restore/restart passed. Versioned images also run healthily on the supplied EC2. Real settings remain ignored; only the example is shareable.

### TASK-015 - Public private-account SaaS authentication and isolation
- **Source:** IDEA-015; explicit choices in prompts 2026-11-20-003/004/005.
- **Priority / dependencies:** P0; TASK-014 and reviewed auth-library/recovery design. Web and Android together; friend builds Pixel 8a Android 16+ APK.
- **Completion criteria:** Public registration, verified-email OTP, password login, email/recovery-code recovery, forgot/change password and revocable browser/native sessions work. No security questions. Every Personal/Practice query, write, cache, job and voice session uses server-derived tenant identity; negative two-user tests pass. Query-driven indexes verified with representative data, pagination and deletion/provenance behavior tested. Enforce approved 20 chat turns/day, 5 voice minutes/day, one active voice session/user and $50/month application AI guard; SMTP via Mumbai SES with real delivery/abuse checks. Check session/OTP expiry, replay/concurrency, public signup throttles and live socket revocation. Obtain web/Pixel voice acceptance; do not claim smoothness from synthetic provider timing alone.
- **Status:** In progress. Source and private stage implement registration/OTP, password/reset/recovery-code/session flows, tenant/mode-scoped data, quotas and voice. 27 automated checks and actual EC2 registration/chat/synthetic voice passed; the disposable fixture was removed. Real SES delivery/suppression, friend APK compilation, Pixel/browser microphone/quality acceptance and public HTTPS remain open. TASK-004/TASK-013 are not complete.

### TASK-016 - Permanently retire the old Victor AWS deployment
- **Source:** IDEA-015; owner deletion instruction and explicit permanent-data-deletion choice in 2026-11-20-003.
- **Priority / dependencies:** P0; agreed retirement timing after plan review, exact project ownership manifest, backup/retention inventory. Recommended after local core proof and before new EC2 release; no data export/migration.
- **Completion criteria:** Retire `victor-phase1` and its project-owned resources, separately remove retained DynamoDB table and budget, and clean confirmed project backup/log/SAM artifact copies without touching unrelated resources. Explain deleted-table PITR/system-backup retention and verify/report what remains. Old API/sign-in unavailable, deletion states checked, residual charges/retention documented. Do not delete a shared SAM bucket/support stack without ownership evidence.
- **Status:** Complete on 2026-11-21. Exact retirement script and independent API checks confirmed old stack/API/Lambda/Cognito/role/log group/table/budget and dedicated SAM support/bucket removed. Backup inventories empty; PITR disabled before table deletion; all 12 reviewed artifact versions removed. No old chats/memory exported/migrated. Supplied EC2 remains running. See docs/legacy-retirement.md for limits and verification.

### TASK-017 - EC2/ALB/domain SaaS release and operations
- **Source:** IDEA-015; owner will provide access/domain later.
- **Priority / dependencies:** P1; TASK-014/015 local acceptance; supplied host/domain/ALB details; TASK-016 retirement sequence. No existing-host reuse assumed.
- **Completion criteria:** Host/workload/capacity inventory, reviewed target group/listener/security-group/DNS changes, HTTPS/WSS domain, private databases, least-privilege provider access, verified SES sender/production delivery, versioned deploy/rollback, off-host encrypted backup and restore drill, agreed load/recovery targets, web/Pixel acceptance. Record infrastructure costs separately from the application AI guard.
- **Status:** In progress. Owner supplied ai_assistant@65.2.130.74 and confirmed its host fingerprint. Private victor-stage is running in ~/victor-stage with versioned verified images; five runtime services healthy, new databases unpublished, web/mail viewer loopback-only. Linked GitHub key pulled Stage successfully. Live EC2 registration/email-code/chat/synthetic voice passed (2.58s first audio after input in one fixture); fixture removed. Domain/ALB and real SES details still pending; no public routing created. Existing workloads/MongoDB/security rules remain unchanged per owner. Host OS/storage/boot limitations are documented, not automatically repaired.

- **2026-11-20 roadmap update:** IDEA-015 supersedes further serverless hosting work in IDEA-014 and TASK-013's Cognito/Lambda deployment assumptions. TASK-013 voice behavior/acceptance remains relevant and moves through TASK-014/015. Prior deployment evidence and incomplete tasks are preserved; none is marked complete by this plan.

- **TASK-014/TASK-015 provider decision update (2026-11-20):** Owner selected OpenAI API chat/memory plus Sarvam speech, with processing outside Mumbai explicitly permitted (prompt 006). Provider/location is resolved; choose a suitable available API model and verify data-control configuration during implementation. No Bedrock dependency is required in the replacement. Remaining gate is review of the proposed backend/Compose design and sequence, not another provider-consent question.

- **2026-11-20 implementation approval (prompt 007):** IDEA-015 design/sequence explicitly approved. TASK-014 and TASK-015 are In progress: new private MongoDB/Redis/Nginx/API Compose services and auth/tenant isolation source created; initial TypeScript/Vite builds and 12 real Mongo/Redis integration tests passed. Runtime startup exposed a new Nginx temporary-path permission issue, corrected in the new container and health verified. Browser registration/login and one harmless OpenAI chat passed. First synthetic voice attempt exposed internal Date/string contract mismatch, corrected; next voice attempt passed, with latency optimization and broader checks still in progress. Android account/Keystore source prepared but SDK/build/Pixel acceptance pending. No task marked complete; old AWS is not yet deleted.

- **2026-11-21 HTTPS stage follow-up (IDEA-015/TASK-017):** Owner supplied ai_test.satishk.com and SMTP, then chose manual Nginx editing (prompts 006?008). Dedicated app is now production-mode with exact HTTPS origin/Secure cookies and real SMTP; TLS/authentication checks passed from EC2 and operator, no email sent. Supplied endpoint is AWS Mail Manager rather than the earlier planned Mumbai SES SMTP endpoint. DNS uses direct host Nginx, so no ALB was created. Proposed domain-only voice/client-IP location blocks passed isolated host-binary syntax check. Manual host application, actual inbox delivery/suppression and browser/Pixel voice acceptance remain open; no unrelated host repair performed.

- **TASK-017 post-reload evidence (2026-11-21, prompt009):** Owner applied the manual Nginx change. Public HTTPS/assets/worklet/origin/private-route checks and WSS upgrade/invalid-session rejection passed. This closes the proxy-handshake verification item; actual signed-in browser microphone/playback, inbox delivery and friend APK/Pixel acceptance remain open. No runtime changes or repairs made.
### TASK-018 - Owned voice-server local POC
- **Source:** IDEA-017; explicit POC approval in prompt 2026-11-21-018.
- **Priority / dependencies:** P1 research prototype; isolated media/VAD dependencies and existing private provider configuration for cloud agent mode. Does not depend on a new LiveKit subscription or Gemini key.
- **Completion criteria:** A runnable isolated local server receives real WebRTC audio; local pretrained VAD emits observable start/stop and honest endpoint events; UI shows backend events; an agent adapter can respond with streaming speech where configured; synthetic transport/VAD/agent and interruption cleanup checks are recorded, with actual microphone/Pixel limits explicit. Production app/data untouched; run instructions, evidence and known limitations saved under research.
- **Status:** Complete for the isolated POC scope on2026-11-21. Python aiortc/CPU ONNX proof and core/cloud media checks passed; prompt020 approved the trailing-silence correction, then browser turn/Stop/End passed. Device/speed/production criteria remain separate.
- **Evidence update (2026-11-21):** Worker/UI and run instructions built; seven core tests and actual local/cloud synthetic WebRTC checks passed. Cloud complete transcript/correct156/non-silent return verified; one endpoint-to-first-server-PCM3941ms is not desired speed acceptance. Browser transport/VAD start, permission-denial/End cleanup and desktop/mobile layout checks passed. Browser synthetic clip needs trailing silence for endpoint completion; scoped owner repair consent pending. Keep this task In progress until that replay and Stop reply are verified or the owner explicitly accepts the limitation. Report: research/voice-chatbot-2026-11-21/12-owned-server-poc-report.md.
- **Related debt:** DEBT-012; existing TASK-013/device acceptance remains separate.
- **Completion follow-up:** Browser correction no longer pending. Initial failure retained; research browser energy sampling inconclusive, independent Python WebRTC nonzero audio verified. TASK-019 carries real-app/staging integration.

### TASK-019 - Integrate owned speech detection into staging app
- **Source:** IDEA-017; explicit authorization in prompt 020.
- **Priority / dependencies:** P1; TASK-018 core, existing app auth/voice protocol and authorized dedicated stage.
- **Completion criteria:** Approved browser replay correction verified; private bounded/authenticated Silero worker integrated with manual STT while retaining backend mode/tenant/memory/checked-TTS boundaries; web shows speech activity; versioned staging deployment with rollback; focused/core and app isolation tests pass; actual authenticated synthetic stage audio round trip demonstrates backend start/end, transcript and audible PCM; public anonymous/foreign-origin checks pass. Record physical-device and latency limitations explicitly.
- **Status:** Complete for this staging increment on2026-11-21. Release stage-owned-ace419520ce9 healthy;28 app checks,3 worker checks and corrected web mute contract passed. Public authenticated synthetic WSS and browser worklet path returned correct156/nonzero PCM; backend start/end, mute/Stop, cookie/origin/anonymous checks verified. Temporary account/records removed, global spend preserved. Initial full-frame1009 failure diagnosed and repaired/redeployed only after prompt021 consent. Existing DB container uptime/proxy/security rules preserved. Full streamed reasoning, physical Pixel/acoustic speed, load/reconnect and rollback drill remain explicitly outside this increment; DEBT-012 open. Report: research/voice-chatbot-2026-11-21/13-staging-owned-voice-integration.md.
- **Related debt:** DEBT-012. No other deployment/device task is closed by this increment.

### TASK-020 - Preserve spoken statements across short pauses
- **Source:** IDEA-017; explicit repair/redeploy consent in2026-11-22 prompt002.
- **Priority / dependencies:** P1 staging defect; current owned speech integration.
- **Completion criteria:** Retain delayed finalized segments in order; separate reply cancellation from accepted input processing; serialize/bound pending input; deduplicate segment delivery and retry identical committed batches idempotently; preserve corrections and stop/logout behavior; real DB test verifies earlier facts/history; full isolated suite passes; versioned staging redeployment and synthetic three-fact/short-pause round trip verifies all facts/history; cleanup and evidence recorded. Existing auth/mode/secret/usage boundaries retained.
- **Status:** Complete on2026-11-22. Both loss paths repaired under explicit consent;35 tests passed including real DB retention, corrected runtime deployed as stage-owned-4becaff17ef6. Initial checker timeout preserved and exact-account storage verified; separately approved checker correction then passed fresh-account public three-segment900ms-gap test, all three statements/facts and nonzero204480-byte PCM. Synthetic accounts removed and absence verified; final stage health/auth controls checked. No claim of durable reconnect/offline input or unlimited fact extraction. See report14.
- **Related debt:** DEBT-012. Input queue is session-local, not a durable offline journal; existing per-message fact extraction/context limits remain.

### TASK-021 - Make Git the staging deployment path
- **Source:** IDEA-019; explicit owner instruction2026-11-22 prompt005.
- **Priority / dependencies:** P1; reviewed current code/records, existing pinned SSH and GitHub access, staging build capacity.
- **Completion criteria:** Persist Git/scoped-sudo rule; default CLI pushes/pulls an expected Stage commit and runs the server checkout’s builder; disable workstation artifact/env shipping; scan reviewed commit for secrets/private runtime paths; commit/push and fast-forward pull current approved source; build/smoke/release on staging and verify health/voice without migrating DB/env data. Ask only if an actual privileged step needs scoped sudo.
- **Status:** Complete on2026-11-22 via prompts014/015: exact Git commitf2f0646 built/deployed and public static/auth/synthetic voice passed, original DB containers preserved. Historical attempts: f8d58dc pushed/pulled, all images built on staging,18 voice checks/worker smoke passed; template permission failure triggered verified automatic rollback. Approved template-only repair c06a61a passed build/smoke/container health. Final static check found microphone worklet mode600/root-owned, HTTP403; broader public-asset ownership/readability repair proposed and consent pending. No workstation artifact/env upload or host sudo used.
- **Debt:** Existing DEBT-011/012 retained; no new blanket privilege or database-migration compromise.
- **Host-only steering (2026-11-22, prompt008):** Owner proposes replacing container Nginx with existing host Nginx and wants exact settings. Prepared site-only fragment/runbook for /srv/victor-web/current and API loopback18081; no host edit, API binding, asset publication or container removal activated. IDEA-020 Discussing. Container public-asset repair is not being pursued while this alternative is reviewed; current restored release remains healthy.

### TASK-022 - Simplify Compose and mount public assets in container Nginx
- **Source:** IDEA-021; explicit owner instruction2026-11-22 prompt010.
- **Priority / dependencies:** P1; existing Git release workflow. Prompt015 selects an ignored app-owned checkout publication directory; prior /srv/sudo dependency is cancelled.
- **Completion criteria:** One root docker-compose.yml with readable static service/network/volume definitions; remove normal environment overlays; retain private DB/API/worker and existing data identity; server read-only frontend mount and laptop equivalent; Nginx HTTP/WSS routing behind outer TLS; Git-side frontend publication, ownership/readability preflight and compatible rollback; updated commands/docs/records; isolated real Nginx mount/static/API/WS/header checks pass. Stage acceptance additionally needs approved public-root setup, exact Git push/pull/build and public auth/voice verification without DB/data/env transfer.
- **Status:** Complete on2026-11-22 for the selected configuration/staging scope. Commitf2f0646 deployed as stage-git-f2f0646806e4-20261122111218;10 local routing groups,18 server voice checks, actual read-only mounted public assets/auth controls and synthetic correct156/nonzero audio passed; exact fixture removed. DB IDs/start times and private parent modes unchanged. No sudo/root-folder/TLS change. Deliberate rollback drill and physical/production acceptance remain separate debt.
- **Debt:** DEBT-013; existing DEBT-011/012. TASK-021 deployment acceptance is complete for this verified rollout.

- **TASK-022/TASK-021 path steering (2026-11-22, prompt015):** Owner cancels the /srv/sudo prerequisite and selects checkout/deploy/.local/web public release/current directories. Update guard, canonical Compose source and tests/runbook, then Git push/pull/build/activate and public auth/voice acceptance. No root folder or private checkout exposure. Prior scoped directory request is cancelled, not pending.

- **TASK-021/TASK-022 acceptance (2026-11-22):** Both complete for stated Git deployment/configuration/staging acceptance; final release evidence linked in prompt015. Physical-device/audio latency, production operating requirements and deliberate coordinated rollback drill remain DEBT-010/011/012/013 follow-ups.
