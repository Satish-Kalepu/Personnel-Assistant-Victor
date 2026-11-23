# Two voice architecture plans - 2026-11-21

## Prompt

great. now lets plan new architecture.&#x20;
i guess database and agent behaviour would be defined in backend.&#x20;
web frontend interface and mobile interface would choose thier own software/sdk stack&#x20;
give me two plans one best and one secondary  . with pros cons

## Questions and decisions

- Authorized scope: two concrete architecture proposals with pros/cons; no implementation or deployment selected yet.
- Preserve experience-first priority, no monthly-budget selection cutoff, current Android/web scope and outside-Mumbai processing permission.
- Clarify backend ownership of durable state, permissions and agent policy versus realtime conversational behavior; clients may use native SDKs while sharing server contracts.
- Proposed comparison: OpenAI continuous voice with independent backend reasoning versus Google native audio agent with backend-owned tools and application state. Selection remains Discussing.

## Actions

- Completed two concrete plans with shared backend/data responsibilities, native-client SDK choices, diagrams, turn flows, pros/cons, sequencing and acceptance criteria.
- Verified current OpenAI Live/client delegation/server control and Google/LiveKit documentation. Read actual web, Android and API dependency manifests; preserved Vite/plain browser UI and Kotlin rather than requiring a UI rewrite.
- Owner added demo/testing scope in prompt 014 and provider-access coordination in prompt 016; shared work remains linked to IDEA-016.

## Files changed

- This record, research/voice-chatbot-2026-11-21/08-two-architecture-plans.md, related study index/log and notes/ideas.md/dairy.md. Demo implementation/testing is recorded in prompt 014.

## Verification

- Current provider interfaces checked against official sources; local source manifests inspected. Research artifact link/JSON/syntax checks passed, including 65 local links across 34 files at the validation point. No production runtime changes; prototype checks recorded separately.

## Outcome

- Two requested plans and pros/cons delivered as proposals. Recommended A: OpenAI direct WebRTC plus backend delegation; secondary B: LiveKit web/Android SDKs plus Node/Gemini worker. Shared database/agent policy remains backend-owned. No final provider selection inferred.
