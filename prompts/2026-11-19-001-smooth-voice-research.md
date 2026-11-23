# Smooth voice research - 2026-11-19 (continued 2026-11-20)

## Prompt
go ahead. and I need voice in web version as well . but i want to be real smooth&#x20;
so research what best products should we use for this. elevanlabs or sarvam sdks&#x20;
or decide yourself if you can make similar quality by yourself

## Questions and decisions
- Owner authorized ordinary interactive voice on Android and web, requested smooth behavior and provider/SDK research, and delegated routine product selection.
- Owner first reaffirmed strict Mumbai-only AI, then explicitly allowed Sarvam. IDEA-013 is Finalized for Sarvam speech; existing Cognito, Bedrock reasoning and memory remain in Mumbai. No Mumbai-only guarantee is claimed for hosted Sarvam. Earlier choices are preserved in the linked records.
- Keep Kotlin and the existing browser; use Sarvam's official JS SDK on an authenticated shared gateway. Flutter SDK targets hosted Voice Agents and does not require a Kotlin rewrite. Do not train a new speech model for this project.
- Personal capture remains gated on Model APIs zero-retention confirmation. Host choice is pending: an existing Mumbai instance was found by inventory only; owner permission to consider reuse and a capacity/workload review are still needed. New managed hosting has an estimated $37.86/month base before usage/tax.
- No AWS deployment/change-set execution, server installation, vendor subscription purchase, or unrelated repair was performed.

## Actions
- Read repository constraints/current Android, browser and Lambda architecture; researched official ElevenLabs, Sarvam SDK/API, AWS speech/hosting, and Android audio documentation. Findings and source links are in docs/voice-research-2026-11-19.md.
- Refreshed existing victor SSO after expiry. Initial Mumbai AWS speech option was superseded after the owner's Sarvam permission; no AWS speech permissions remain in the final template.
- Prepared gateway source for Saaras v4 realtime partial STT and Bulbul v4 Flash streaming TTS, Cognito JWT authentication, fixed mode/subject, foreground cleanup, interruption generation checks, warm TTS handshake, shared allowance reservations and secret-held owned-reply synthesis.
- Added Android and web controls/capture/playback. Gateway URL is obtained from authenticated backend config, so the existing three Android public properties remain sufficient. Sarvam key never enters the clients.
- Inspected the actual pinned JS SDK 1.1.20 and configured the Node ws transport; verified real SDK handshakes against a local WebSocket server.
- Owner placed the key privately in root .env. Added ignore rules and performed value-free source/index checks. Ran one paid synthetic-only provider check with a fixed harmless phrase; no personal microphone recordings were uploaded.
- Prepared hosting/resource/cost review using public AWS price-catalog reads; found one running Linux t3.medium in Mumbai and three hosted DNS zones via metadata only. No OS login, workload inspection or DNS modification.

## Files changed
- `.gitignore`; Android manifest, MainActivity.kt, and new VoiceConnection.kt.
- Backend core/handler/web adapters, new app/voice.py, template.yaml, README.md, web controls/assets/worklet, and focused Python/JS tests.
- `voice-gateway/`: pinned package/lockfile, server/session/Sarvam adapters, synthetic-only checker, Docker files, env example, README, and SDK/session tests. No real key in these files.
- `docs/voice-research-2026-11-19.md`, `docs/voice-deployment-review.md`, Android handoff and web client guide.
- `notes/ideas.md` (IDEA-013), `notes/todo.md` (TASK-005/013), `notes/tech-debt.md` (DEBT-002/008/009), `notes/v1-scope.md`, `dairy.md`, and the linked prompt entries.
- Tool-generated SAM metadata/build artifacts and ignored synthetic sample; root `.env` was supplied by the owner and was not copied into records or modified by the agent.

## Verification
- 20 Python backend tests passed, including mode/owner isolation, shared allowance, secret holds and voice reply references.
- 11 gateway tests passed: real SDK STT/TTS handshake serialization/auth, WAV/PCM framing, partials, cancellation, late responses, mute, rate/duration bounds, allowance hold, prewarming and late-handshake cleanup.
- Web voice permission cleanup, stale playback/mute, PCM resampling and existing memory rendering checks passed; JS syntax and Python compilation checked.
- SAM source and built-template lint passed; Python 3.13 SAM packaging succeeded and includes voice.py, voice.js and voice-worklet.js. Initial sandbox temp/metadata restrictions were resolved by process-local metadata redirection and an approved build exception; no persistent global configuration repair.
- Local Node 22 Docker image builds; localhost health returned 200 and invalid access token was rejected with 1008 before any paid provider connection. Test container was stopped. Latest container excludes the synthetic checker/audio.
- Live synthetic Sarvam test: connect-to-first-PCM 692ms; generated audio 4.02 seconds; transcript correctly read the fixed test phrase. This is not measured full-chat latency, human-accent/noise accuracy, actual playback or a voice-quality preference result.
- Real key absent from 17 inspected implementation/package files; root env not tracked. No key value or transient authorization link was copied into repository notes.
- Native voice update has not been compiled or device-tested; owner still uses the previously working APK. Personal mic/browser live tests and hosting remain pending.

## Outcome
- Research and source implementation prepared; TASK-013 remains In progress. A synthetic provider integration is verified. Live voice is not deployed and cannot yet be described as smooth on the target devices.
- Next required inputs: confirm Model APIs zero retention and host reuse/separate-host choice. Then review concrete hosting resources/change set, deploy after approval, rebuild Android through the owner's friend, and complete Pixel/browser latency and behavior checks. No ZIP or external message sent.
