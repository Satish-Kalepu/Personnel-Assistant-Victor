# Stage 5 supporting notes: per-conversation cost and operations

Checked 2026-11-21. **Cost is informational only. No monthly-budget ceiling is used to choose the best experience.** These public snapshots do not alter the current application's allowance settings.

## Compare one conversation with the same workload

Record active duration, input audio, spoken output duration, context growth, tokens, tool usage, retries/speculation, media traffic and infrastructure. “One minute” can mean a connected session minute, input audio minute, output speech minute, or a conversion from tokens. They are not interchangeable billing units.

| Option | Verified public billing snapshot | What to add or verify |
|---|---|---|
| GPT-Live 1.1 | Active $0.05/min; standby $0.02/min, billed by seconds | Backend models/tools billed separately; standby applies to eligible paused WebRTC sessions, not arbitrary conversational silence. Ten active minutes = $0.50 for voice alone. [Model](https://developers.openai.com/api/docs/models/gpt-live-1.1), [pricing](https://developers.openai.com/api/docs/pricing) |
| OpenAI Realtime 2.1 | Audio input $32/M tokens, output $64/M; text input $4/M, output $24/M | Cached inputs have separate rates; use actual session usage rather than generic minute conversion. [Pricing](https://developers.openai.com/api/docs/pricing) |
| Gemini 3.8 Live Developer API | Audio input $3/M tokens (page gives $0.005/min); audio output $12/M ($0.018/min); text input/output $0.75/$4.50 per M | Context, thinking/text, search and API surface change totals. These are Developer API prices, not a Cloud managed contract quote. [Pricing section](https://aistudio.google.com/docs/pricing#gemini-3.8-live) |
| Sarvam pay as you go | STT INR 0.49/min; Bulbul v4 Flash INR 2/1,000 chars, before GST | Current page differs from prior project TTS estimate. Ten input minutes plus 2,700 output chars = INR 10.30 for these two speech items, excluding reasoning/hosting/tax. [Current prices](https://docs.sarvam.ai/api/getting-started/pricing) |
| ElevenAgents Realtime | Platform per-minute rate plus realtime input/cached/output tokens | Mini/Max differ; inspect current plan and mode, voice and residency compatibility. [Mode pricing description](https://elevenlabs.io/docs/eleven-agents/customization/realtime-models) |
| AWS Nova Sonic, Azure Voice Live, Cartesia, managed orchestration | Public pricing depends on selected model, region, plan and included components | Bedrock pricing page was opened but a reliable Nova 2.5 rate was not extracted; no numeric rate invented. Obtain matching SKU rates at experiment time. [Bedrock pricing](https://aws.amazon.com/bedrock/pricing/) |

The Sarvam arithmetic assumes exactly the listed audio duration and characters. The Google minute equivalents apply to the page's audio units, not a guaranteed total conversation cost. Do not compare these rows as complete bills or use price as a proxy for quality.

## Spending that may improve experience

Evaluate available priority inference for backend models, warm media workers, regional deployment, better echo/noise processing, better voices, and reserved/dedicated serving where offered. Verify each changes the relevant latency span. Dedicated capacity may address queue variability, while geographic placement may address network delay. Neither guarantees better turn-taking or reasoning quality.

Model-specific support matters: Nova 2.5 Sonic's current card lists Standard only, and the Gemini 3.8 Live Developer model card does not list Priority inference. Do not recommend an unsupported premium mode just because budget is flexible. An enterprise contract, Cloud provisioned-throughput offering and a Developer API priority flag are different products.

## Data, application state and operating behavior

- Keep application credentials and authoritative permission checks on the server. Use short-lived client credentials or server-negotiated media sessions as supported by the selected API.
- Separate model training policy, abuse-monitoring retention, application state, and your own transcript/audio logs. OpenAI documents no API training by default but separate monitoring/storage rules; `store:false` alone is not a universal zero-retention guarantee. [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).
- Sarvam's workspace default remains indefinite until configured; product overrides matter and changes are not retroactive. The project owner previously confirmed zero-day Model APIs retention; this run did not re-audit that account setting. [Sarvam retention](https://docs.sarvam.ai/api/platform/data-retention).
- Google Developer free and paid pricing rows specify different product-improvement use. Use the selected product's actual terms and account controls before personal-audio trials; do not infer Cloud terms from an AI Studio demo. The attempted direct terms URL was unavailable in this run. [Pricing/data-use rows](https://aistudio.google.com/docs/pricing).
- Preserve tenant/mode separation, durable task status and memory deletion even when media goes directly to a provider. Keep raw audio recording opt-in for experiments and logs free of credentials.
- Track model/API changes and runtime adapter compatibility. Prefer stable snapshots where offered; record aliases and date where no immutable snapshot exists. A reproducible measurement is tied to a version and conditions.
- Watch provider session quotas, CPU/thermal saturation, connection recovery and tool/backend failures. A live voice model must fail clearly rather than inventing successful actions.

No purchases, subscription changes, retention settings, account permissions, infrastructure or runtime budget controls were changed in this research.
