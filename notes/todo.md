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
- **Status:** In progress; owner chose Google Pixel 8a with Android 16 or later and a friend to compile (IDEA-012, 2026-11-18). Owner has no local Android SDK. Source/config handoff and build/device checklist are in `docs/android-build-handoff.md`; deliver a debug APK, checksum, and build result, then perform the stated device checks. Compilation, installation, and device acceptance remain pending.

### TASK-005 — Confidential retrieval and voice chat
- **Source:** IDEA-003
- **Priority / dependencies:** P0; Phase 1 and target phone.
- **Completion criteria:** Server-verified passkey step-up protects classified retrieval and explicit offline speech for 15 minutes; detected secrets never reach model input.
- **Status:** Pending

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

## Completed

### TASK-011 — Occasional browser client
- **Source:** IDEA-008
- **Priority / dependencies:** P1; deployed Phase 1 API and Cognito sign-in.
- **Completion criteria:** Browser page loads over HTTPS, completes Cognito PKCE sign-in, sends Personal and Practice chats separately, reviews/corrects/deletes Personal facts, and signed-out data calls remain rejected.
- **Status:** Complete on 2026-11-09. Live page/assets returned 200, Cognito accepted the callback, and signed-out chat/memory requests returned 401. Owner reports successful sign-in, replies in both modes, a Personal memory edit and deletion, and sign-out with sign-in required on reload.

