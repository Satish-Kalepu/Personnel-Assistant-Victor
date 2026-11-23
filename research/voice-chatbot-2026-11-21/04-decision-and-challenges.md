# Stage 3b: provisional decision and skeptical review

Date: 2026-11-21. Architecture/provider status: **Discussing**. Experience priority is approved; implementation choice is not.

## Recommendation

Prototype **GPT-Live 1.1 + direct WebRTC + server-side client delegation to the current application backend** first. In the same screening study compare **Gemini 3.8 Live**, **OpenAI Realtime 2.1**, and **a LiveKit + Flux + streamed LLM + Sonic 3.6 cascade**. Keep the current OpenAI/Sarvam implementation as control. Include Nova 2.5 Sonic, Azure Voice Live, and ElevenAgents in the next screening group so the ecosystem comparison stays broad.

This ordering reflects architectural fit and ease of testing the key hypothesis, not a verified speed/voice ranking. GPT-Live explicitly separates continuous voice from existing backend work; the project already owns a suitable backend. Gemini's current native-audio and non-blocking tool support make it a serious competing design. [OpenAI architecture choices](https://developers.openai.com/api/docs/guides/voice-agents), [Gemini 3.8 model](https://aistudio.google.com/docs/models/gemini-3.8-live).

## Decision matrix: use cases rather than invented scores

| Priority/use case | First choice to evaluate | Reason | Evidence still needed |
|---|---|---|---|
| Continuous personal conversation while work runs | GPT-Live frontend + independent backend | Explicit full-duplex/delegation separation | Correctness, useful-answer timing, owner voice preference |
| Google-native mobile/multimodal experience | Gemini Live; Firebase Kotlin/web comparison | Native audio, tools, supported mobile integration | Transport stability, exact backend surface, release terms |
| Simple fast native speech/reasoning in one session | OpenAI Realtime | Avoid unnecessary delegation for basic turns | Compare against Live's overhead and behavior |
| Exact spoken text, chosen voice, provider control | Fully streaming cascade | Inspectable intermediate text and independent components | Entire pipeline and cancellation timing |
| AWS-first operation | Nova 2.5 Sonic; then AWS cascade | Unified speech model plus AWS tool backend | Actual regional route and app feature parity |
| Existing Azure investment or enterprise speech needs | Azure Voice Live | Integrated processing and voice choices | Model/region routing and device listening tests |
| Voice identity and turnkey agent tooling | ElevenAgents native and custom modes | Managed timing and broad voice workflow | Preferred voice/latency and mode restrictions |
| Indian-language specialization | Sarvam baseline and optimized streaming variant | Existing integration, Indic speech focus | Indian English/code-switch accuracy and naturalness |
| Offline commands or connectivity loss | Local audio controls and small local speech/intent models | No network required for narrow actions | Pixel-supported models, sustained performance |
| Fully private/self-hosted intelligence | GPU-hosted native models/cascade; separate phone experiment | Control over hardware, serving and data path | Quality, operational reliability, licensing and hardware measurements |

## Challenge the recommendation

| Counterargument | Why it is credible | Experiment or design response |
|---|---|---|
| GPT-Live could sound responsive while the real answer is slow | A fast voice frontend can acknowledge immediately while backend latency stays unchanged | Measure useful-answer and verified task completion independently |
| A unified model may answer faster than delegated voice | Simple prompts may need no separate backend | Include Realtime and Gemini with minimal necessary tooling |
| A tuned cascade can outperform native audio | Speculation and specialized components can overlap work | Match task/voice/network and compare optimized cascade, not only today's buffered control |
| Direct WSS/RTC might be worse on the owner's network | Routing, loss, TURN/TCP fallback and provider geography vary | Compare direct and framework-mediated paths; record actual route |
| Fast turn detection may reduce conversation quality | Thought pauses, numbers and corrections resemble an ending | Pause/interruption suite plus false-positive rate; do not optimize a latency metric alone |
| Moving extraction off the speech path can break memory promises | Next-turn read could race a pending write | Pending/committed state, dependency barrier and failure tests; proposal needs approval |
| Native media can bypass transcript-based controls | Audio reaches the model before final text exists | Compare ordinary conversation separately; protect sensitive mode with a compatible path |
| Expensive maximum reasoning can make ordinary replies worse | Better deliberation does not imply lower latency or better turn-taking | Route by task difficulty; test quality and delay together |
| A plugin/framework may lag a new model | Model release does not imply SDK support | Verify exact protocol/version with synthetic integration before quality trials |
| On-device should always win because there is no network | Local load, inference, thermals and model quality can dominate | Measure sustained real-time factor and task quality on Pixel; do not infer from laptop/GPU demos |

## Evidence conflicts and freshness findings

- **Google lifecycle:** Stable/GA Gemini 3.8 model pages coexist with preview language in API/token guides. Pin the chosen product surface and confirm production terms; do not silently resolve this as universal GA.
- **Google location:** `asia-south1` availability and `us`/`eu` ML-processing rows are different statements. Request routing cannot establish inference residency or an India latency result.
- **AWS capabilities:** Current Polly supports incremental-text bidirectional synthesis on generative voices. Generic advice that all Polly requests require a complete response is stale.
- **AWS tiers:** Nova's page describes several Bedrock tiers generically but marks only Standard supported for this model. Money does not make an unsupported tier available.
- **ElevenLabs metrics:** Methodology gives warm server-side median numbers while marketing retains older figures. No direct vendor-to-vendor comparison follows.
- **ElevenLabs product layers:** Eleven Realtime Mini/Max, Scribe v3 Live, and streaming TTS are separate choices. Native mode restricts custom LLM configuration; copying Scribe v2 examples misses new turn prediction.
- **AssemblyAI freshness:** Search still surfaces Universal-Streaming while November 2026 selection/release material names STT-3.7. Recheck exact model/plugin support.
- **Mistral:** Realtime model card mentions diarization and turn detection, while the operational guide prohibits enabling them together. For integration, honor the operational restriction until verified otherwise.
- **Sarvam pricing:** Current price page shows Bulbul v4 Flash pay-as-you-go at INR 2/1,000 characters; the prior November 19 project note recorded INR 1. Treat historical estimates as historical. No billing code or old records were changed.
- **Hume:** EVI URL redirected to Audio Decisions. Do not rank a present-day voice service from older memory; current serving availability is unresolved.

Supporting primary links are in the corresponding platform rows and [source register](sources.md). This desk research cannot settle differences in account entitlements, service load, real-time quality, or undocumented routing.

## What would change the recommendation?

Select a competing native model if it consistently wins human preference and useful-answer latency with equal task correctness and interruption reliability. Select the cascade if its voice/control/language benefits win preference without unacceptable delay. Select local intelligence only after sustained Pixel measurements show the needed quality and responsiveness. Keep several options eligible where they occupy different points on the quality/latency frontier.

There is **no cost ceiling or budget-based elimination rule**. Report price and operating effort after experience results. Retain the current implementation until a chosen alternative passes the device and application criteria; this research made no runtime changes.
