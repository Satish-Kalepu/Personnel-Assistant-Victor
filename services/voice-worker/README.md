# Private owned speech-detection worker

Staging increment for IDEA-017 / TASK-019. Receives mono PCM16 at16kHz only from the authenticated Node app, runs local Silero ONNX and a640ms silence endpoint, and returns speech segments with288ms pre-roll plus start/end events. It does not access user accounts, memory, databases, model-provider keys or files containing human audio.

The Node adapter uses Sarvam manual endpointing, while the existing backend retains signed-session/tenant/mode/conversation checks, memory rules, usage reservations, owned-reply speech checks and cancellation. This increment keeps existing web/Android HTTPS/WSS PCM transport; it is **not** a public WebRTC/TURN deployment. The standalone research POC remains the actual WebRTC experiment.

## Model and build

```powershell
python services/voice-worker/fetch_model.py
docker build -t victor-voice-worker:reviewed services/voice-worker
```

The official model is pinned by commit and SHA-256 in model-manifest.json; ignored `.models/` is populated before Docker build. Python/ONNX dependencies are separate from the Node image. The model/VAD core was extracted from the local research POC; keep both copies aligned until the experimental transport is consolidated. The container is non-root, read-only, drops capabilities, has CPU/memory limits and no published port. Its network is internal. A dedicated private token shared only with the API protects `/listen`; it is generated on staging without displaying it. `/health` is an internal readiness endpoint.

## Deployment and rollback

`compose.owned-voice.yml` is an explicit staging opt-in layered over base+production Compose. Current owner-selected deployment is `node deploy/scripts/deploy-stage.mjs`: commit/review/push Stage, fast-forward pull the expected commit and build images on staging. The worker model is downloaded/verified on staging; private env and databases stay there. Workstation image/env shipping is retired. `owned-voice-release.mjs build` remains local verification only. See [Git deployment](../../docs/git-stage-deployment.md). MongoDB/Redis containers and host Nginx/security rules stay in place. Runtime secrets are never put into build contexts.

The release pointer and private backup live under `/home/ai_assistant/victor-stage`. For a rollback, use the prior release and its matching private env backup, validate Compose, then start only that release’s API/web/worker with `--no-deps`; keep persistent database volumes. Each release’s source hash and actual verification belong in the stage record. Automatic container-health rollback exists; a deliberate rollback drill has not been performed.

The Git-native update helper now preserves `VOICE_ENDPOINT_MODE=owned` by building/copying the worker/overlay when that mode is active. These working-tree changes must be committed/pushed before relying on a server Git checkout to deploy them. Current staging images are built from the recorded local source hash, not an unpushed Git revision.

## Checks and limits

`test_worker.py` verifies real synthetic speech boundaries/pre-roll, digital silence, private-token rejection, acceptance of a complete3200-byte frame and socket cleanup. The underlying aiohttp transport limit is4096 because its installed parser rejects a frame equal to that limit; application validation still caps PCM input at3200 bytes. Pacing, concurrency and lifetime are bounded at both app and worker. Worker disconnect fails the voice session explicitly; it does not silently switch providers.

640ms non-speech means a pause, not semantic thought completion. Actual speaker echo, thinking pauses, accents, barge-in, Bluetooth, reconnect/capacity and Pixel acceptance remain open. The app’s current model reply/checked persistence gate still precedes synthesis; full streamed reasoning is a further integration increment, not a claimed result here. Existing app usage limits are retained. Warming/model choice and human acoustic latency need separate comparison; this feature is not a measured speed winner.

Original staging failure and approved repairs are preserved in the research evidence. One unused `aiohttp` AppKey warning and an ONNX runtime telemetry-device-ID warning were observed; they do not fail the checked flow. Provider/account retention controls and general third-party runtime telemetry require separate review before production acceptance.
