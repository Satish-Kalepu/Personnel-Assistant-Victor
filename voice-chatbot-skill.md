---
name: voice-chatbot
description: Implement the chosen streaming voice chatbot architecture with WSS PCM audio, owned Silero speech detection, Sarvam STT/TTS, and an authenticated application backend.
---

# Voice chatbot: the architecture to implement

Use this architecture to add the current voice experience to another product. This file is the complete implementation specification; it needs no companion documents or source files. To use it as an agent skill, save it as `voice-chatbot/SKILL.md` in your skill directory.

## Stack and responsibilities

| Component | Choice / responsibility |
|---|---|
| Browser | JavaScript, `getUserMedia`, Web Audio `AudioContext` and `AudioWorklet`; continuous microphone capture and queued PCM playback. |
| Android | Kotlin, OkHttp WebSocket, `AudioRecord` and `AudioTrack`; communication audio focus/routing and available acoustic echo cancellation. |
| Application API | Node 24+, TypeScript, Express, `ws`, Zod; authentication, voice orchestration, ordered input, application policy and quotas. |
| Private speech worker | Python, `aiohttp`, NumPy, ONNX Runtime and pretrained Silero VAD; speech boundaries and pre-roll. |
| STT | Sarvam `saaras:v4` realtime streaming, manual endpointing, `stream_type=fast`, `language_code=en-IN`. |
| Reasoning | OpenAI Node SDK, Responses API with strict structured output. Voice baseline: `gpt-6-luna`, reasoning `none`. |
| TTS | Sarvam `bulbul:v4-flash`, `sarvamai` JavaScript SDK, speaker `simran_en_customer`, language `en-IN`. |
| State | MongoDB replica set for transactional history/facts; Redis for conversation locks, quotas and expiring voice leases. |
| Hosting | Docker Compose; Nginx serves frontend assets and proxies API/voice. Server TLS terminates at host Nginx or ALB. |

```text
Browser / Android
    <-> HTTPS + WSS <-> Application API
                           -> private Silero worker -> speech audio + boundaries
                           <-> Sarvam STT -> finalized text
                           -> ordered input queue
                           -> existing product backend <-> OpenAI
                           -> persist history / allowed facts
                           -> check owned assistant reply
                           -> Sarvam TTS -> streamed PCM -> client playback
```

The application backend owns identity, business rules, history and memory. The worker only detects speech and has no database access or provider keys. Integrate voice with the product's existing chat service; keep the same authorization and business policy as text chat.

## Audio contract

- **Capture:** signed little-endian PCM16, mono, 16 kHz. Send binary frames of 1,600 samples: 3,200 bytes / 100 ms. Resample real microphone input; do not just relabel its sample rate.
- **Detection:** reassemble incoming frames into 512-sample / 32 ms Silero windows, preserving leftover bytes and detector state per connection.
- **Playback:** mono PCM16 at 24 kHz. TTS returns WAV chunks; parse headers and validate format before forwarding raw PCM as base64 JSON audio events. Never play WAV headers or compressed audio as PCM.
- Bound input sizes and real-time pacing. Keep the worker transport limit above the application frame limit: 4,096 versus 3,200 bytes.

## Session and wire protocol

Expose authenticated `GET /api/voice/config`, returning the same-origin `/voice` gateway. Use WSS on HTTPS and WS on localhost. Browser sessions use Secure/HttpOnly cookies; native clients send a signed application session token in the first message. Provider keys remain server-side.

```json
{"type":"start","conversationId":"<owned-id>","mode":"<product-mode>","token":null}
```

Validate identity, conversation ownership, allowed mode and usage before accepting audio. Return `ready` with `sampleRate:16000`, `outputSampleRate:24000` and the allowed session duration; then accept binary frames.

Client controls:

```json
{"type":"interrupt"}
{"type":"mute","value":true}
{"type":"mute","value":false}
{"type":"stop"}
```

Use the exact `value` field on both clients and server. Mute controls assistant playback; capture continues. Stop releases the microphone and ends the session.

Server events: `ready`, `state`, `speechBoundary`, `transcript` with `final`, `reply`, `clear`, `audio`, `speechEnd`, `error`. `clear` and `audio` include an output-generation `turn`; clients discard audio from older turns. Each client also tracks a local session generation to reject callbacks from a replaced connection.

## Speech detection and STT

1. Open the Sarvam realtime STT connection at `/speech-to-text-realtime/ws` using server-side authentication. Configure `saaras:v4`, `en-IN`, `transcribe`, `fast`, `endpointing=manual`, `encoding=linear16`, `sample_rate=16000`.
2. Stream incoming PCM to the private worker, protected by a separate bearer token. Use a pinned, checksum-verified Silero ONNX model and CPU inference.
3. Activate speech after three 32 ms windows at probability 0.60 or above. Continue active speech at threshold 0.45. Maintain nine windows / 288 ms of pre-roll.
4. On speech start, interrupt obsolete output and send STT `speech_start`, followed by pre-roll and speech audio as base64 `audio_input` events.
5. After 640 ms of non-speech, emit the boundary and send STT `speech_end`. This detects a pause, not semantic thought completion.
6. Associate each final transcript with its ordered utterance ID. Preserve an older final that arrives after the next utterance starts. Ignore duplicate IDs, not repeated words. Match the ordered final events to pending utterances.

Keep STT open across utterances. Select a Node WebSocket transport that preserves authentication headers; use `ws` for provider sockets.

## Input retention and interruption

Maintain separate lifetimes for **accepted user input** and **replaceable assistant output**.

```text
Final transcript:
  enqueue nonempty text in utterance order
  wait until no active speech, no pending finals, no active input batch

Process:
  group pending statements within the request bound
  assign a stable clientMessageId to that exact batch
  call the product's chat backend serially
  validate and persist user input, assistant reply and permitted facts
  speak only if that output generation is still current

New speech:
  advance output generation, close obsolete TTS, clear client playback
  preserve accepted input processing and queued statements

Ambiguous backend failure:
  retain the same batch ID/content and retry it before newer input
  pause retry until further user input; report the failure

Stop / logout / disconnect / expiry:
  abort session work, clear unsaved input, release sockets and leases
```

Use tenant + conversation + mode + `clientMessageId` for idempotent commits. Reject changed content under an existing ID. Conversation locking and transactions prevent overlapping writes and duplicate facts.

Bounds: 128 queued parts / 16,000 characters, grouped requests up to 4,000 characters, and 20 pending STT finals. Fail explicitly on overflow. The queue is session-local: interrupted output does not lose accepted input, but disconnect/Stop can cancel unsaved work.

One batch makes one structured model call; this architecture does not imply an autonomous tool-execution loop. The baseline extracts at most five durable facts per batch. Retaining statements is distinct from extracting every possible fact.

## Model, synthesis and playback

The backend adapter accepts authenticated context, text, conversation ID, stable client message ID and a cancellation signal. It supplies bounded prior context, calls OpenAI, validates `{reply, facts}` and persists the result transactionally. Use `store:false`, at most 700 output tokens and concise spoken replies. Adapt fact extraction and prompts to the new product.

Return a persisted assistant reply ID and ISO timestamp. Resolve speech text from that owned reply; do not synthesize arbitrary client-submitted text. The complete validated model result precedes TTS.

Open/configure the TTS socket while the model is thinking, but send text only after the speech-approval check. Configure `bulbul:v4-flash`, `simran_en_customer`, `en-IN`, 24 kHz WAV, pace 1, preprocessing enabled and completion events. Send text, flush, stream audio and close on completion/interruption. Limit each TTS text message to 2,500 characters. Guard every callback with current generation, closed and mute checks.

Schedule browser PCM chunks at `max(audioContext.currentTime + 0.025, nextAudioTime)`. Advance the timeline by each chunk's duration. Retain every playback handle so `clear` can stop/disconnect all queued sound and reset the timeline. `speechEnd` means synthesis is complete; wait for scheduled playback to drain before showing listening state.

## Build and deploy

1. Implement the authenticated session, ordered queue and backend adapters, then the private detector and speech-provider adapters.
2. Add browser capture/playback: user gesture, microphone permission, resumed audio context, authenticated connection, `ready`, then continuous framed capture. Request echo cancellation and noise suppression. Release everything on Stop/navigation/sign-out; retain text-chat fallback.
3. Implement Android with the identical frame/event contract, bounded playback queues, protected session storage and foreground audio lifecycle.
4. Package API, worker, Nginx, MongoDB and Redis in one Compose stack. Only web ingress publishes an app port. Keep the worker/database networks private and use a generated worker token of at least 32 characters.
5. Serve assets, `/api/*`, `/voice` and the microphone worklet under one HTTPS origin. Proxy `/voice` with HTTP/1.1, Upgrade/Connection headers, buffering off and a 360-second read timeout. Serve a missing worklet as 404, not SPA HTML. Trust forwarded client-IP/scheme headers only from the real proxy hop.
6. Keep settings in private server env: origin, auth secrets, provider keys/models/voice, database/Redis connection settings, `VOICE_ENDPOINT_MODE=owned`, worker address/token and quotas. Enable the worker's Compose profile. Never expose keys in frontend bundles or commit private env.
7. Deploy reviewed commits through Git, non-force push and fast-forward pull of the expected commit. Build versioned images on the target host. Keep private settings/data there and retain matching prior frontend/API/worker releases for rollback.

## Acceptance and operating limits

Enforce one voice session per user, bounded global concurrency, expiring Redis leases and session/ownership rechecks about every three seconds. Baseline limits are 20 global sessions, five-minute sessions, 20 chat turns/user/day and 300 voice seconds/user/day. Admission budgets are configurable safeguards, not guaranteed provider invoice caps.

Before release, verify:

- Nonzero audio, correct resampling/WAV parsing and continuous chunk playback.
- Three paused statements, delayed earlier finals, duplicate deliveries and ambiguous retries preserve ordered history without duplicate commits.
- Barge-in clears stale audio while accepted input still finishes; Stop/logout release capture and prevent later output.
- Web and Android mute/unmute keep the connection alive and use the same wire fields.
- Invalid/expired sessions, foreign origins, cross-user access, slow clients and quota excess fail safely.
- Actual microphone, speaker/headset echo, thinking pauses, mobile audio routing and weak-network behavior. Measure speech-end to first audible output separately from server PCM arrival.

Keep user data tenant-scoped and transcripts/history untrusted in model prompts. Configure provider retention for the new product; `store:false` alone does not establish zero retention or a processing region. Smoothness must be checked on the target devices and network; it is not guaranteed by choosing the stack alone.
