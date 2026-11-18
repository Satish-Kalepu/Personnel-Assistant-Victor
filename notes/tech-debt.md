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
## Resolved

No resolved entries yet.

