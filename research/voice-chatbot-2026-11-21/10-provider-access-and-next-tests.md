# Provider access and next live tests

Date: 2026-11-21. Owner explicitly invited requests for missing subscriptions/API access in prompt 016. No purchase or account change has been made.

## What is already available

The existing privately configured OpenAI API key supported initial Live server audio and browser WebRTC connection checks. Another OpenAI key is not needed for those tests. Complete-input/answer evidence and calibrated timing are still pending; successful access does not establish voice quality.

## What is needed for Plan B

Choose one of these access arrangements:

| Arrangement | Private settings | What it enables |
|---|---|---|
| LiveKit project plus own Google API key | LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, GEMINI_API_KEY | Full LiveKit media candidate plus independent Google provider tests/billing |
| LiveKit project only | LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET | Gemini 3.8 Live through LiveKit Inference, which handles model access/billing |
| Google API key first | GEMINI_API_KEY | Direct Google protocol/audio smoke check; full LiveKit media candidate still pending |

LiveKit's official integration documents Gemini 3.8 Live through LiveKit Inference with LiveKit credentials and no separate Google API key. Direct Google plugin use is a separate auth/billing arrangement. [LiveKit Gemini integration](https://docs.livekit.io/agents/models/realtime/gemini/).

The current LiveKit **Build** plan is listed at $0/month with no credit card required and included inference credits. A paid monthly plan is not automatically required to create the initial demo project; model usage/credits, quotas and later features still need account verification. Do not buy a premium plan solely for this unmeasured comparison. [Official pricing](https://livekit.com/pricing).

For Google direct testing, create a key in [Google AI Studio](https://aistudio.google.com/apikey) for a project with access to the selected Live model. Billing or project verification may be required for account-specific access/quota; API access is what matters here. [Official key setup](https://aistudio.google.com/docs/api-key).

## How to provide configuration privately

Add selected values to the **existing local repository root `.env`**, preserving all existing settings. The [tracked example](demo/provider.env.example) contains names only; do not save secrets in it, in screenshots, in chat, or in research documents. Reply with a readiness confirmation after configuration, without including values. No credential has been requested in the demo UI.

An asynchronous setup question offered these choices. Selection/readiness is pending until the owner responds; silence is not treated as setup completion or purchase authorization.

## Runtime and implementation gate

LiveKit's Node quickstart currently requires Node >=24 and pnpm >=10. Native media/plugin support must be checked for the chosen worker runtime; the existence of a Windows CLI installer alone is not proof that every agent dependency works natively on Windows. Prefer a compatible isolated worker/container if needed, without installing or changing the deployed assistant. [Official quickstart](https://docs.livekit.io/agents/start/voice-ai/), [Node agents repository](https://github.com/livekit/agents-js).

The current lab's Plan B live button remains unavailable. Adding keys alone does not provision the room/agent worker or implement the second live adapter. After access is ready: verify only key presence/model access without printing values, implement the isolated worker/media path, and run synthetic integration before any personal microphone trial.

## Next evidence to collect

1. A complete OpenAI speech input and an observable useful spoken answer; inspect lifecycle/event timing before scoring.
2. The chosen Google access path's synthetic input/output and tool result evidence.
3. Browser media and cleanup for both plans, then physical Pixel microphone/speaker/headset behavior.
4. Calibrated acoustic useful-answer and interruption timing, task correctness and owner listening preference under the common benchmark.

No provider winner, paid subscription requirement, successful secondary setup or production readiness is inferred from the current screens.
