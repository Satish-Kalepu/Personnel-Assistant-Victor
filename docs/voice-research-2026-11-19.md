# Voice provider research - 2026-11-19

Owner authorized voice for both Android and web, requested a smooth experience, and asked about ElevenLabs and Sarvam SDKs. The owner first reaffirmed Mumbai-only AI processing, then explicitly allowed Sarvam. The resulting decision is Sarvam for speech; existing reasoning, memory, and authentication stay in Mumbai. Sarvam-hosted speech must not be described as verified Mumbai-only processing.

## Recommendation and comparison

| Option | Fit for Victor | Decision |
| --- | --- | --- |
| Sarvam Model APIs: Saaras v4 realtime + Bulbul v4 Flash | Streaming partial recognition, Indian English synthesis, usage pricing, official JS/Python SDKs; keep Victor's existing brain | Selected after owner's explicit permission |
| Sarvam Flutter Voice Agents SDK | Captures/plays speech for the hosted Samvaad agent; includes events and interruption support | Useful product, but introducing Flutter and a separate hosted agent is unnecessary for the current Kotlin app |
| ElevenLabs | SDKs for web/Android, high-expressiveness/low-latency model options and managed turn-taking | Credible quality comparison; not selected after Sarvam permission. Published latency excludes other pipeline stages |
| AWS Transcribe Streaming + Polly Neural | Both documented in Mumbai; live read-only lookup found Kajal neural en-IN | Feasible Mumbai-only baseline, but not evidence of parity with modern expressive voices |
| Self-host Sarvam | SageMaker/VPC option for stronger locality control, with hourly software and GPU infrastructure costs | Not chosen for a small personal workload without pricing/region validation |
| Train our own speech models | Requires data, training, serving, evaluation, and ongoing model work | Not justified here. Build the product/audio orchestration around existing speech models |

The [official Sarvam SDK page](https://docs.sarvam.ai/api/getting-started/sdks) provides Python and JavaScript clients for Model APIs with typed calls, async operations, errors and streaming. The installed JS package 1.1.20 was inspected and pinned; realtime STT and TTS connection methods exist. Local WebSocket handshake tests verify authentication headers and method serialization. The gateway explicitly selects the Node `ws` transport, because the SDK prefers a global browser-style WebSocket that cannot carry its STT auth header on modern Node.

The [Flutter SDK](https://docs.sarvam.ai/voice-agents/deploy/sdks/flutter) wraps Samvaad Voice Agents with capture, playback and session callbacks. It is not the same layer as standalone Model APIs. Its examples place an API key in client configuration; Victor instead keeps the key on an authenticated server. Kotlin can use the same private gateway protocol as the browser without a Flutter rewrite.

Use Sarvam's [new realtime STT API](https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/realtime-streaming) for partial transcripts and turn events, rather than the legacy endpoint with final-only results. Configure English, 16kHz PCM, fast mode, and tune endpointing on the actual phone. [TTS streaming](https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/streaming-api/web-socket) begins playback progressively. Its interruption recipe requires clearing local playback and closing the interrupted TTS socket; there is no in-band cancel/clear operation. The implementation follows that approach.

## Location and data handling

Sarvam's [TTS product page](https://www.sarvam.ai/text-to-speech) describes India-only processing and no training on API inputs. Its [general terms](https://www.sarvam.ai/terms-of-service), section 8.2, also permit transfers to countries where providers operate. Neither establishes a Mumbai-only guarantee for a standard managed account. Obtain plan-specific confirmation before claiming stricter geography; company nationality is not a location guarantee. Sarvam sees microphone audio and synthesized reply text; existing Bedrock reasoning remains in Mumbai.

The current [Model APIs retention documentation](https://docs.sarvam.ai/api/platform/data-retention) says unset workspace retention is indefinite, permits a Model APIs zero-day override, and says changes are not retroactive. This is more specific than broad marketing language about default zero retention. Before live use, verify workspace and product settings. The gateway refuses startup until that step is explicitly confirmed in server configuration. No personal recordings have been sent. After the owner provided a private local key, a fixed synthetic phrase was used for a short connectivity test.

For comparison, [ElevenLabs residency](https://elevenlabs.io/docs/overview/administration/data-residency) is an Enterprise capability, and the documentation distinguishes selected storage location from possible processing elsewhere. Do not equate an India endpoint or low latency with Mumbai-only inference. Its [latency methodology](https://elevenlabs.io/docs/eleven-api/concepts/latency-methodology) reports server-side medians, excluding network, model-answer generation, buffering and playback.

AWS [Transcribe regional support](https://docs.aws.amazon.com/transcribe/latest/dg/what-is.html) includes Mumbai streaming; [Polly Neural](https://docs.aws.amazon.com/polly/latest/dg/neural-voices.html) supports Mumbai. AWS [Polly Generative](https://docs.aws.amazon.com/polly/latest/dg/generative-voices.html) and [Nova 2.5 Sonic](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-5-sonic.html) do not list Mumbai in their in-region availability. A Mumbai calling endpoint must not be confused with a cross-region model. The read-only account check found no effective AI-services opt-out policy; no policy was changed. [AWS's opt-out guidance](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/omni-opting-out-of-using-your-data-for-service-improvement.html) is relevant if the AWS speech alternative is revisited.

## Cost example, not a spending promise

The [Sarvam Model API price table](https://docs.sarvam.ai/api/getting-started/pricing) currently lists pay-as-you-go STT at INR 0.49/minute and Bulbul v4 Flash at INR 1/1,000 characters, excluding GST. No paid subscription is required for pay-as-you-go. A hypothetical 30-minute active session per day for 30 days streams 900 minutes of audio, costing INR 441 for recognition. If Victor speaks for half that time at an assumed 900 characters/minute, 405,000 characters cost INR 405. Combined speech estimate: **INR 846 before GST**, plus gateway hosting, AWS model/API/storage charges and any other provider fees. Continuous capture includes listening/silence during the active conversation; it is not billed as only the user's voiced words. Actual cadence and voice usage can differ substantially.

[ElevenLabs API pricing](https://elevenlabs.io/pricing/api) distinguishes usage-based components from a managed speech engine; the latter is listed at USD 0.08/minute. At 900 minutes that component alone would be USD 72, before additional charges. These are different product bundles, not an apples-to-apples quality or total-cost benchmark.

## What smooth means and what remains unverified

- Start one foreground voice session; recognize speech incrementally and show partial transcripts. Initial endpointing is 650ms, to be tuned for pauses and Indian English.
- Speak replies automatically, with Mute replies, Stop speaking, and Stop voice. Clear queued audio immediately on interruption; reject old generations and late responses.
- Keep connections warm during the session. Stream TTS PCM to the player; avoid downloading a complete audio file or using the browser's vendor-dependent speech voices.
- Keep mode fixed per session; stop on mode switch, logout/backgrounding, and new chat. Transcripts go through Victor's existing secret hold and memory logic. Confidential retrieval/speech remains unimplemented; do not speak secrets to the app.
- Bound session duration, input frame rate/size, output queues, and estimated shared allowance. No automatic retry of a paid model turn after network failure.

The existing backend returns a complete JSON reply/facts object before TTS begins. It is not token-streaming speech-to-speech. The new voice flag asks for short natural replies to reduce waiting, but model generation and fact parsing remain on the critical path. Moving extraction off the speech path or adding response streaming is a separate design change if measured results miss the target. The current HTTP API cannot simply be made duplex by selecting a streaming speech SDK; [AWS response streaming documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/response-transfer-mode.html) limits that feature to REST APIs and does not provide request streaming. A persistent authenticated gateway is included in source.

Proposed release goals (targets, not measured results): median end-of-speech to first audible reply <=1.8s; p95 <=3s on a good connection; local stop/queue clearing <=150ms; no old audio after mode/session changes. Test at least 30 utterances with names, numbers, natural pauses and moderate noise; measure actual audio onset at the device, not just provider first-byte time. Include Pixel 8a Android 16, desktop Chrome/Edge, phone browser, Wi-Fi/cellular, permission denial, headphones/speaker echo, disconnects, muted replies, secret hold and allowance hold. One synthetic test passed: first PCM arrived in 692ms including connection setup, 4.02 seconds of speech were generated, and Saaras transcribed the sample correctly. This is not a listening-quality comparison or a complete chat/device latency measurement; native APK build and device validation remain pending.

## Hosting and rollout

Gateway source is in [voice-gateway](../voice-gateway/README.md); backend/client changes are prepared locally. Hosting remains unselected/unprovisioned; see [deployment cost review](voice-deployment-review.md). [ECS Express Mode](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.html) is one practical Mumbai candidate with a managed HTTPS endpoint, but creates billable Fargate, ALB, logs and networking. An existing approved WSS-capable host could be cheaper. Do not infer that provider usage prices include hosting or that existing account budget alerts cover Sarvam. Prepare a concrete deployment cost/resource review before provisioning.

Next: provide the Sarvam key through a server-side secret mechanism, confirm Model APIs zero retention, review the gateway host and AWS change set, test live with harmless synthetic phrases, then deploy web and rebuild Android. No new ZIP is needed; the owner shares this repository with the builder.


## Follow-up on 2026-11-20

The owner confirmed the Sarvam key was ready and placed it in the private root .env. Root .env/.ENV ignore rules were added; a value-free check confirmed the key is not embedded in the inspected implementation/package files and the env file is not tracked. Model APIs zero-retention confirmation is still pending; personal capture remains gated.

A Node 22 container is built locally, and the gateway now starts the TTS handshake while the model is thinking, sending synthesis text only after the owned-reply/allowance check. Offline tests cover this prewarming and late-handshake cleanup. Twenty backend tests, eleven gateway tests, web voice/memory checks, SAM build/lint and Docker checks pass. There has been no hosting deployment or rebuilt native APK. Read-only inventory found one running Linux t3.medium in Mumbai and three DNS zones; no server login, workload inspection or modification occurred. The owner was asked whether that server can be considered for reuse before any installation. New managed hosting has an estimated USD 37.86/month base in the reviewed configuration, before usage/taxes; no spend was committed.


## API Gateway and setup clarification (2026-11-20)

Owner confirmed Model APIs retention is No retention (0 days); this is owner-reported, not an independent account-UI audit. That confirmation is no longer a missing input. Owner questioned the need for EC2; no existing-server reuse was approved. API Gateway WebSocket plus an on-demand Lambda worker is a credible alternative to investigate, with session buffering/ordering, authentication, packet encoding and latency work. The prior hosting estimate describes one candidate, not a mandatory architecture. See [API Gateway alternative](voice-api-gateway-option.md). No application refactor or infrastructure change performed for this discussion.
