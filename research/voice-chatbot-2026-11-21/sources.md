# Primary-source register

Retrieved on 2026-11-21 unless stated otherwise. Entries are short original summaries, not archived copies. DOCUMENTED means the source describes a capability; it does not establish account access, reliability or measured comparative performance. VENDOR CLAIM labels quality/latency assertions. Discovery-only entries are not used to choose a runtime winner.

## OpenAI

| ID | Primary source | Evidence used | Type |
|---|---|---|---|
| S01 | [GPT-Live overview](https://developers.openai.com/api/docs/guides/live) | Full-duplex voice with independent backend; RTC, WS and sideband options | DOCUMENTED |
| S02 | [GPT-Live 1.1 model](https://developers.openai.com/api/docs/models/gpt-live-1.1) | Model identity, separate Live endpoint, duration billing | DOCUMENTED |
| S03 | [Live delegation](https://developers.openai.com/api/docs/guides/live-delegation) | Client/Responses modes; context ownership and tool execution | DOCUMENTED |
| S04 | [Server controls](https://developers.openai.com/api/docs/guides/voice-server-controls?api=live) | Private sideband, replay deduplication and speech-control considerations | DOCUMENTED |
| S05 | [Live session management](https://developers.openai.com/api/docs/guides/live-conversations) | Startup configuration, transcripts and session lifecycle | DOCUMENTED |
| S06 | [Realtime overview](https://developers.openai.com/api/docs/guides/realtime) | Current guide uses Realtime 2.1 | DOCUMENTED |
| S07 | [Voice architecture comparison](https://developers.openai.com/api/docs/guides/voice-agents) | Live, Realtime and cascaded architecture distinctions | DOCUMENTED |
| S08 | [WebRTC transport](https://developers.openai.com/api/docs/guides/voice-webrtc) | Native media plus control-channel connection | DOCUMENTED |
| S09 | [Realtime VAD](https://developers.openai.com/api/docs/guides/realtime-vad) | Semantic versus silence-driven turn detection | DOCUMENTED |
| S10 | [Realtime conversation control](https://developers.openai.com/api/docs/guides/realtime-conversations) | Interruption and unplayed-audio history truncation | DOCUMENTED |
| S11 | [API pricing](https://developers.openai.com/api/docs/pricing) | Current Live duration and Realtime audio/text rates | DOCUMENTED; temporal snapshot |
| S12 | [Data controls](https://developers.openai.com/api/docs/guides/your-data) | Training policy differs from abuse monitoring/application-state retention | DOCUMENTED |
| S13 | [Voice-agent evaluation](https://developers.openai.com/cookbook/examples/audio/voice_agent_evaluation) | Task correctness, audio timing and continuous-interaction evaluation | DOCUMENTED methodology |

## Google

| ID | Primary source | Evidence used | Type |
|---|---|---|---|
| S14 | [Developer Live overview](https://aistudio.google.com/docs/live-api) | Continuous audio, direct/server WSS paths, PCM formats | DOCUMENTED |
| S15 | [Gemini 3.8 Live](https://aistudio.google.com/docs/models/gemini-3.8-live) | Current model, non-blocking tools, built-in interleaved reasoning | DOCUMENTED; speed/quality adjectives are VENDOR CLAIM |
| S16 | [Live capabilities](https://aistudio.google.com/docs/live-api/capabilities) | Model differences and API-preview language | DOCUMENTED |
| S17 | [Ephemeral tokens](https://aistudio.google.com/docs/live-api/ephemeral-tokens) | Short-lived constrained credentials for direct clients | DOCUMENTED; feature-preview language |
| S18 | [Firebase Live quickstart](https://firebase.google.com/docs/ai-logic/live-api/) | Kotlin/web SDK integration paths | DOCUMENTED |
| S19 | [Firebase Live configuration](https://firebase.google.com/docs/ai-logic/live-api/configuration) | Interrupted-response handling and local buffers | DOCUMENTED |
| S20 | [Cloud Gemini 3.8 Live card](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-8-live) | GA model; availability and ML-processing rows differ | DOCUMENTED; location interpretation unresolved |
| S21 | [Cloud Live overview](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/live-api) | Managed product model choices | DOCUMENTED |
| S22 | [Cloud Live reference](https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/models/live-api) | Server-to-server API and partner mobile integration | DOCUMENTED |
| S23 | [Cloud bidirectional synthesis](https://docs.cloud.google.com/text-to-speech/docs/create-audio-text-streaming) | Incremental text input with concurrent audio output | DOCUMENTED |
| S24 | [Gemini-TTS API choices](https://docs.cloud.google.com/text-to-speech/docs/gemini-tts) | Different APIs and streaming/text-input distinctions | DOCUMENTED |
| S25 | [Developer API pricing](https://aistudio.google.com/docs/pricing#gemini-3.8-live) | Audio/text rates; free/paid product-improvement rows | DOCUMENTED; temporal snapshot |
| S26 | [ML Kit GenAI](https://developers.google.com/ml-kit/genai) | Custom-agent device support list; Pixel 8a absent | DOCUMENTED |
| S27 | [ML Kit direct model setup](https://developers.google.com/ml-kit/genai/prompt/android/get-started) | Runtime capability/configuration checks and model constraints | DOCUMENTED |
| S28 | [LiteRT-LM repository](https://github.com/google-ai-edge/LiteRT-LM) | Edge LLM inference framework | DOCUMENTED project scope; no Pixel benchmark |

## AWS and Microsoft

| ID | Primary source | Evidence used | Type |
|---|---|---|---|
| S29 | [Nova 2.5 Sonic card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-5-sonic.html) | Current model/operation, async tools, regions, feature and tier support | DOCUMENTED; performance adjectives are VENDOR CLAIM |
| S30 | [Nova bidirectional API](https://docs.aws.amazon.com/nova/latest/userguide/speech-bidirection.html) | Streaming operation and SDK integration concept | DOCUMENTED; older-generation guide, card controls current model details |
| S31 | [Transcribe partial results](https://docs.aws.amazon.com/transcribe/latest/dg/streaming-partial-results.html) | Stability/accuracy tradeoff and mutable partials | DOCUMENTED |
| S32 | [Transcribe streaming guidance](https://docs.aws.amazon.com/transcribe/latest/dg/streaming.html) | Uniform 50–200 ms chunks and sampling guidance | DOCUMENTED |
| S33 | [Polly bidirectional synthesis](https://docs.aws.amazon.com/polly/latest/dg/bidirectional-streaming.html) | Incremental text; generative-engine and SDK restrictions | DOCUMENTED |
| S34 | [Polly stream lifecycle](https://docs.aws.amazon.com/polly/latest/dg/bidirectional-streaming-lifecycle.html) | Buffering, flushing, stream lifecycle | DOCUMENTED |
| S35 | [Polly streaming API](https://docs.aws.amazon.com/polly/latest/APIReference/API_StartSpeechSynthesisStream.html) | `StartSpeechSynthesisStream`, generative engine requirement | DOCUMENTED |
| S36 | [Bedrock pricing](https://aws.amazon.com/bedrock/pricing/) | Pricing entry point; reliable Sonic 2.5 rate not extracted | Opened; no numeric model-rate conclusion |
| S37 | [Bedrock data protection](https://docs.aws.amazon.com/bedrock/latest/userguide/data-protection.html) | Customer controls, encryption/logging and responsibility | DOCUMENTED |
| S38 | [Azure Voice Live](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live) | Integrated speech, model options, echo/turn features | DOCUMENTED |
| S39 | [Azure Voice Live WebRTC](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-webrtc) | Direct media; currently global standard routing | DOCUMENTED |

## Speech vendors and frameworks

| ID | Primary source | Evidence used | Type |
|---|---|---|---|
| S40 | [Deepgram Flux parameters](https://developers.deepgram.com/docs/flux/configuration) | Turn thresholds, eager mode and resumed turns | DOCUMENTED |
| S41 | [Deepgram eager EOT](https://developers.deepgram.com/docs/flux/voice-agent-eager-eot) | Cancellable early preparation protocol | DOCUMENTED; latency gains are VENDOR CLAIM |
| S42 | [Deepgram Voice Agent](https://developers.deepgram.com/docs/voice-agent) | Managed configurable speech pipeline | DOCUMENTED |
| S43 | [Cartesia Sonic 3.6](https://docs.cartesia.ai/build-with-cartesia/tts-models/latest) | Model/snapshot, languages and Hinglish focus | DOCUMENTED; naturalness claims untested |
| S44 | [Cartesia TTS WebSocket](https://docs.cartesia.ai/api-reference/tts/websocket) | Context IDs, incremental generation and cancellation | DOCUMENTED |
| S45 | [ElevenAgents overview](https://elevenlabs.io/docs/eleven-agents/overview) | Managed cascade versus realtime modes | DOCUMENTED |
| S46 | [Eleven native realtime modes](https://elevenlabs.io/docs/eleven-agents/customization/realtime-models) | Mini/Max; managed settings, price structure and mode/region/retention restrictions | DOCUMENTED |
| S47 | [Eleven model catalog](https://elevenlabs.io/docs/overview/models) | Scribe v3 Live and turn prediction; SDK feature caveat | DOCUMENTED; benchmark quality claims untested |
| S48 | [Eleven latency methodology](https://elevenlabs.io/docs/eleven-api/concepts/latency-methodology) | Warm server-side median definition | VENDOR CLAIM with documented measurement scope |
| S49 | [Eleven latency tuning](https://elevenlabs.io/docs/eleven-api/guides/how-to/best-practices/latency-optimization) | Streaming, voice, region and priority considerations | DOCUMENTED guidance; latency figures are VENDOR CLAIM |
| S50 | [Eleven websocket TTS](https://elevenlabs.io/docs/eleven-api/guides/how-to/websockets/realtime-tts) | Text buffering/flush and quality tradeoff | DOCUMENTED |
| S51 | [Eleven Kotlin SDK](https://elevenlabs.io/docs/eleven-agents/libraries/kotlin) | Android WebRTC session integration | DOCUMENTED |
| S52 | [Sarvam realtime STT](https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/realtime-streaming) | Saaras v4 interim events, VAD and manual endpointing | DOCUMENTED |
| S53 | [Sarvam streaming TTS](https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/streaming-api/web-socket) | Bulbul v4 Flash, incremental text and cancellation recipe | DOCUMENTED |
| S54 | [Sarvam pricing](https://docs.sarvam.ai/api/getting-started/pricing) | Current pay-as-you-go speech rates | DOCUMENTED; temporal snapshot |
| S55 | [Sarvam retention](https://docs.sarvam.ai/api/platform/data-retention) | Workspace defaults, product overrides, non-retroactivity | DOCUMENTED |
| S56 | [AssemblyAI current model selection](https://www.assemblyai.com/blog/which-assemblyai-stt-3-7-model) | STT-3.7-Realtime-Agent versus transcript-oriented models | DOCUMENTED vendor guidance dated November 2026 |
| S57 | [AssemblyAI release log](https://www.assemblyai.com/changelog) | Current-generation model announcement | DOCUMENTED |
| S58 | [Mistral voice overview](https://docs.mistral.ai/studio/audio/overview) | Voxtral 3 realtime STT/TTS | DOCUMENTED; advertised delay is not end-to-end latency |
| S59 | [Mistral STT guide](https://docs.mistral.ai/studio/audio/speech-to-text/overview) | Offline versus realtime; diarization/turn-detection restriction | DOCUMENTED operational guide |
| S60 | [Gradium docs](https://docs.gradium.ai/) | Streaming speech and semantic turn controls | DOCUMENTED overview; no benchmark |
| S61 | [Speechmatics docs](https://docs.speechmatics.com/) | Realtime/Agent STT, TTS and deployment options | DOCUMENTED overview; no benchmark |
| S62 | [Soniox translation](https://soniox.com/speech-translation) | Official realtime multilingual offering | Discovery only; STT docs URL was inaccessible |
| S63 | [Hume Audio Decisions](https://dev.hume.ai/audio-decisions/docs/overview) | Current destination of old EVI link; audio judging, not a verified voice runtime | Discovery only |
| S64 | [LiveKit sessions](https://docs.livekit.io/agents/logic/sessions/) | Node runtime and configurable voice sessions | DOCUMENTED |
| S65 | [LiveKit turn tuning](https://docs.livekit.io/agents/logic/turns/tuning/) | Endpointing, interruptions and speculative generation | DOCUMENTED |
| S66 | [LiveKit session trace reference](https://docs.livekit.io/reference/agents/session-traces/) | Observable stage spans and overlap | DOCUMENTED |
| S67 | [Pipecat architecture](https://docs.pipecat.ai/pipecat/learn/overview) | Frame-based streaming, transport and provider orchestration | DOCUMENTED; response-time range is VENDOR CLAIM |
| S68 | [Pipecat Smart Turn](https://docs.pipecat.ai/api-reference/server/utilities/turn-detection/smart-turn-overview) | Semantic/acoustic turn classification and local ONNX implementation | DOCUMENTED |
| S69 | [Groq latency guide](https://console.groq.com/docs/production-readiness/optimizing-latency) | Server versus total latency and first-token measurement | DOCUMENTED |
| S70 | [Cerebras streaming](https://inference-docs.cerebras.ai/capabilities/streaming) | Incremental text model responses | DOCUMENTED |
| S71 | [Vapi introduction](https://docs.vapi.ai/quickstart/introduction) | Managed provider-composable voice platform | DOCUMENTED; subsecond response statement is VENDOR CLAIM |
| S72 | [Retell web calls](https://docs.retellai.com/deploy/web-call) | In-app browser microphone/speaker voice sessions | DOCUMENTED |

## Devices, open models and experimental method

| ID | Primary source | Evidence used | Type |
|---|---|---|---|
| S73 | [Android SpeechRecognizer](https://developer.android.com/reference/android/speech/SpeechRecognizer) | Explicit on-device availability and lifecycle APIs | DOCUMENTED |
| S74 | [Android low-latency audio](https://developer.android.com/games/sdk/oboe/low-latency-audio) | Buffers, sample rates and callback discipline; game examples need adaptation | DOCUMENTED guidance; example results not generalized |
| S75 | [Android AEC](https://developer.android.com/reference/android/media/audiofx/AcousticEchoCanceler) | Device echo cancellation capability API | DOCUMENTED |
| S76 | [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | Local Whisper implementation | DOCUMENTED project scope; no device result |
| S77 | [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) | Offline speech toolkit, Android/STT/TTS/VAD support | DOCUMENTED project scope |
| S78 | [Kyutai Moshi](https://github.com/kyutai-labs/moshi) | Full-duplex architecture and hardware-specific demonstration | DOCUMENTED architecture; GPU latency is author-reported |
| S79 | [NVIDIA PersonaPlex](https://github.com/NVIDIA/personaplex) | Public real-time speech project | Discovery/project scope only |
| S80 | [Qwen3-Omni](https://github.com/QwenLM/Qwen3-Omni) | Public realtime speech-capable multimodal model | Discovery/project scope only |
| S81 | [Apple Foundation Models](https://developer.apple.com/documentation/FoundationModels) | Official framework entry; page body not read beyond JS/Markdown shell | Discovery only; no capability conclusion |
| S82 | [Stivers et al., PNAS 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC2705608/) | Human response-offset evidence and cross-language variation | PRIMARY RESEARCH; not an AI latency SLA |
| S83 | [TurnBench official repository](https://github.com/SesameAILabs/turnbench) | Turn/interruption metrics and gated separately licensed data | PRIMARY RESEARCH implementation |

## Local evidence

| ID | Source | Scope |
|---|---|---|
| L01 | [Current model adapter](../../services/api/src/model.ts) | Complete JSON response/facts; voice effort and concise prompt |
| L02 | [Current assistant](../../services/api/src/assistant.ts) | Owned retrieval and synchronous durable response/facts |
| L03 | [Current voice session](../../services/api/src/voice/session.mjs) | Final-transcript trigger, warming and generation cancellation |
| L04 | [Current Sarvam adapter](../../services/api/src/voice/sarvam.mjs) | Exact configured models, 650 ms endpointing and PCM handling |
| L05 | [Prior voice study](../../docs/voice-research-2026-11-19.md) | Historical synthetic observations and earlier assumptions |
| L06 | [Tech debt](../../notes/tech-debt.md) | DEBT-008 and historical local/EC2 synthetic observations |
| L07 | [OpenAI/location approval](../../prompts/2026-11-20-006-openai-outside-mumbai-approved.md) | Existing provider and outside-Mumbai permission |
| L08 | [Research priority](../../prompts/2026-11-21-011-voice-research-priority.md) and [no-cap clarification](../../prompts/2026-11-21-012-voice-experience-without-budget-cap.md) | Owner explicitly chooses experience first; cost informational |

## Access limitations and exclusions

Soniox realtime-STT URL and direct Google terms URL could not be opened. Hume's old EVI URL redirected to a different product. Apple landing content required a follow-up; it was not needed for Android/web selection. Account entitlements, contract pricing, provider retention configuration, precise processing location, and target-device latency were not inspected or measured. No third-party comparison blog or vendor benchmark establishes the study winner.
