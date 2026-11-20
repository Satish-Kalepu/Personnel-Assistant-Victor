# Pending tech debt

Track known compromises, why they exist, their impact, and the conditions for resolving them. Link each entry to its source idea or task. Do not invent debt to fill this file.

## Open

### DEBT-001 — Automatic secret detection is fallible
- **Source:** IDEA-003, TASK-005
- **Recorded:** 2026-11-09
- **Compromise and reason:** Ordinary chat must recognize passwords without an explicit save command. Unmarked values can evade automated detection.
- **Impact / risk:** A false negative may reach a model or an ordinary record. Phase 1 holds suspected secrets and does not implement secret saving or retrieval.
- **Proposed follow-up:** Test pre-model classification, encrypted spans, uncertainty confirmation, passkey retrieval, and corrections; report measured misses.
- **Status:** Open

### DEBT-002 — Processing allowance is not an AWS bill cap
- **Source:** IDEA-001, IDEA-005, TASK-007, TASK-010
- **Recorded:** 2026-11-09
- **Compromise and reason:** The Phase 1 gate atomically reserves an estimated 5 cents per chat against a $50 monthly allowance. It does not yet account for audio/email jobs or actual AWS billing; other charges can bypass it.
- **Impact / risk:** Actual AWS charges may exceed $50.
- **Proposed follow-up:** Implement per-job reservations, app quotas, and measured Mumbai costs. The $50 account-wide AWS Budget with email notifications is deployed; notifications can lag charges.
- **Status:** Open
- **Voice update (2026-11-19, IDEA-013/TASK-013):** Prepared source adds shared reservations of 10 US cents per up-to-five-minute listening session and 2 cents/1,000 TTS characters rounded up, plus normal chat reservations. These use a conservative INR conversion assumption, not actual invoice reconciliation. Sarvam fees are outside the AWS account budget alerts; hosting adds AWS charges. Live metering/reconciliation and other future job types remain open.

### DEBT-003 — Target phone and wake phrase unknown
- **Source:** IDEA-005, IDEA-006, TASK-008
- **Recorded:** 2026-11-09
- **Compromise and reason:** Originally no phone was chosen (2026-11-09). On 2026-11-18 the owner selected Google Pixel 8a, Android 16 or later (IDEA-012); custom wake phrase and recording still depend on measured device behavior.
- **Impact / risk:** Recording continuity and battery use cannot yet be promised.
- **Proposed follow-up:** Test on the selected Pixel 8a and record the exact OS build, battery, interruption, and launch results; the prior choice was Google Assistant launch first.
- **Status:** Open

### DEBT-004 — Immediate memory may contain errors
- **Source:** IDEA-002, TASK-003
- **Recorded:** 2026-11-09
- **Compromise and reason:** Facts enter the graph without pre-review, per the approved choice.
- **Impact / risk:** Incorrect or conflicting facts may affect answers.
- **Proposed follow-up:** Retain provenance and confidence, expose correction/deletion, measure extraction quality.
- **Status:** Open

### DEBT-005 — Browser assets use API and Lambda requests
- **Source:** IDEA-008, TASK-011
- **Recorded:** 2026-11-09
- **Compromise and reason:** The occasional web page shares the Mumbai API Gateway/Lambda instead of adding static hosting resources.
- **Impact / risk:** Every HTML, CSS, and JavaScript request incurs API/Lambda usage and page-load latency. These requests do not count toward the app's chat allowance.
- **Proposed follow-up:** Measure usage and cost; move assets to private S3 with HTTPS CloudFront hosting if browser use grows.
- **Status:** Open

### DEBT-006 — Memory review response is capped at 100 facts
- **Source:** IDEA-010, TASK-012
- **Recorded:** 2026-11-09
- **Compromise and reason:** The current `GET /facts` response reads at most 100 facts from a partition keyed by fact ID, with no pagination cursor. The new Pending/All views filter only that response.
- **Impact / risk:** Once the owner has more than 100 facts, some may be absent from both views, including pending items.
- **Proposed follow-up:** Add paginated fact retrieval and a stable time-based index or cursor, then test review across pages before memory grows beyond this bound.
- **Status:** Open

### DEBT-007 - Android source has no Gradle wrapper
- **Source:** IDEA-012, TASK-004
- **Recorded:** 2026-11-18
- **Compromise and reason:** Source has Gradle build scripts but no gradlew, gradlew.bat, or gradle/wrapper files. No wrapper was added during the build handoff; this is an observed existing limitation, not a verified build failure.
- **Impact / risk:** Builder must install and select Gradle 8.13 separately; a different local version may cause a build failure.
- **Proposed follow-up:** Use installed Gradle 8.13 for the first build as documented. A checked-in wrapper can be proposed separately for approval and verified on the builder's machine.
- **Status:** Open
### DEBT-008 - Voice waits for the complete chat reply/facts response
- **Source:** IDEA-013, TASK-013
- **Recorded:** 2026-11-19
- **Compromise and reason:** STT/TTS stream, but the current chat Lambda produces and validates a complete reply/facts JSON object before synthesis. The voice flag requests concise answers; no token streaming or asynchronous fact extraction has been added.
- **Impact / risk:** Model generation and fact parsing can miss the desired first-audio latency despite fast speech APIs. End-to-end voice quality/latency remains unmeasured.
- **Proposed follow-up:** Benchmark on Pixel and browsers with harmless phrases. If targets fail, propose streaming validated reply text and/or moving memory extraction off the audio critical path while preserving secret/mode/ownership boundaries.
- **Status:** Open

### DEBT-009 - Voice connection coordination is per gateway process
- **Source:** IDEA-013, TASK-013
- **Recorded:** 2026-11-19
- **Compromise and reason:** Single-process owner/session tracking is sufficient for the initial private gateway and avoids another coordination data store.
- **Impact / risk:** Multiple replicas would not enforce a global one-voice-session-per-owner limit; session restarts can incur another conservative reservation. In-flight Lambda work may finish after a gateway cancellation, so interruption does not guarantee charge or history rollback.
- **Proposed follow-up:** Keep one gateway process for the initial reviewed deployment; add shared session leases and cancellation/idempotency design before scaling or promising global limits.
- **Status:** Open

## Resolved

No resolved entries yet.


## Planning follow-up

### DEBT-010 - Proposed single-EC2 SaaS failure domain
- **Source:** IDEA-015; TASK-014/TASK-017; docs/docker-mongodb-saas-plan.md.
- **Status:** Accepted initial operating compromise under IDEA-015 (2026-11-20); remote deployment and production recovery targets remain pending.
- **Compromise and reason:** Docker/Compose with MongoDB and Redis on one supplied EC2 is simpler to operate initially and follows the owner's hosting direction.
- **Impact / risk:** EC2, disk or host maintenance can stop both application and database. ALB/restart policies and a single-node MongoDB replica set do not provide host/database high availability. Logs, indexes and model/voice concurrency can exhaust disk/RAM.
- **Required before public launch:** Explicit recovery/downtime targets, resource/disk alarms, authenticated private databases, encrypted persistent storage and off-host backups, restore verification, versioned deploy/rollback and documented capacity limits. Old personal data selected for deletion must not be exported into new backups.
- **Later options:** Separate or managed MongoDB, independent replicas, multi-host deployment and maintenance automation when scale/recovery requirements justify them. Do not label the first Compose host highly available.

- **2026-11-20 migration context:** DEBT-002 needs both per-user and application-wide admission accounting for public signup; the $50 application guard is not an invoice guarantee. DEBT-009 process-local voice ownership must become shared/revocable under TASK-015; planned Redis use does not close it. DEBT-001 secret detection and DEBT-008 speech latency remain unresolved; a provider/backend port alone does not repair them.

- **DEBT-010 accepted direction (2026-11-20):** Owner approved IDEA-015 and the initial Compose/EC2 design. The single-host compromise is selected, not yet deployed remotely. Off-host backup destination, recovery targets and restore evidence remain production release requirements. The initial local implementation is not high availability.
