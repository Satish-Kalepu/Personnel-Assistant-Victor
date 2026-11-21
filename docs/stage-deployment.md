ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¿# Stage deployment record

## Running service - 2026-11-21

Owner supplied `ai_assistant@65.2.130.74` (prompt 001, IDEA-015/TASK-017), explicitly confirmed its ED25519 fingerprint (prompt 003), preserved existing MongoDB/security rules (prompt 004), and authorized GitHub push/pull (prompt 005).

The `victor-stage` project is running under `/home/ai_assistant/victor-stage`. API, web, MongoDB and Redis are healthy; database setup exited successfully. Initial private-stage Mailpit is stopped and its volume preserved; the production-mode app uses real SMTP. New MongoDB/Redis have no published ports. Web binds only `127.0.0.1:18080`; Mailpit viewer only `127.0.0.1:18025`. Existing host services, the stopped unrelated container, native databases and security groups remain unchanged.

The operator SSH tunnel initially provided:

- App: http://localhost:18080
- Stage email viewer: http://localhost:18025

The tunnel is private and temporary. Reopen from this workspace using `node deploy/scripts/stage-tunnel.mjs` if needed; it refuses occupied local ports rather than stopping other processes. The owner subsequently supplied `https://ai_test.satishk.com`: DNS points directly to this EC2 and existing host Nginx already proxies the domain to port 18080. The app now uses that exact HTTPS origin, production Secure cookies and owner-supplied authenticated TLS SMTP. The original localhost-origin rejection (403) is resolved: empty registration validation from the domain now returns the expected 400. Owner applied the proxy update; public WebSocket upgrade and invalid-session rejection passed in prompt 009. The exact handoff remains in [stage-nginx.md](stage-nginx.md). The localhost app tunnel can be used for readiness, but sign-in should use the HTTPS domain now. There is no ALB in the connected Mumbai account. No DNS, certificate, ALB, target-group or host proxy changes have been made by this deployment.

## Deployment and source

**Current deployment policy,2026-11-22:** [Git push/pull and server-side builds](git-stage-deployment.md) replace workstation artifact/env transfers. Use `node deploy/scripts/deploy-stage.mjs` after reviewing/committing Stage. Request scoped sudo only for a necessary privileged host operation. Earlier image-transfer records below are historical evidence, not current instructions.

Initial images: `victor-api:stage-20261121-97197a2064f2` and `victor-web:stage-20261121-97197a2064f2`. App source snapshot SHA-256: `97197a2064f2bd31524ce41b438edbcdb72c4b0de7a41276f4e010be388091ef`. All five application/database/mail image filesystems and runtime configurations matched across the laptop and EC2 when compared using Docker API 1.44. Docker 29/containerd identifiers differ from Docker 25 classic identifiers; raw ID equality was therefore not treated as proof of failure or silently waived.

Compose v5.5.1 was verified against Docker's published SHA-256 and installed only in the application's private Docker configuration directory. System Docker 25.0.3 was not upgraded. Real settings are in `~/victor-stage/shared/.env`, mode 600, outside Git and build contexts. Independent stage DB/auth/mail/backup secrets were generated; only required provider keys were copied through verified SSH. No private SSH keys or development database volumes were transferred.

The Git-native build/deploy helper has passed Bash syntax checks; its complete remote-build/rollback path has not been exercised. Initial deployment used the already-verified local images.

The linked GitHub key successfully cloned the `Stage` branch into `~/victor-stage/repository`; application source was already pushed at `d91075b`. Helper/record commit `79fd23f` was non-force pushed and fast-forward pulled successfully on EC2, preserving that user commit. The server checkout refuses dirty changes and uses fast-forward pulls. For a reviewed source update, `deploy/scripts/deploy-stage-from-git.sh` pulls Stage, builds versioned images inside Docker (no host Node upgrade), preserves the private env values/data, and starts the dedicated release with health checks. Previous image settings are retained for rollback; do not prune other images or reset volumes.

## Verification

- 27 real MongoDB/Redis/auth/tenant/quota/voice-protocol tests passed before deployment.
- Actual EC2 registration, local email-code verification, recovery-code enrollment, signed authentication and OpenAI chat passed.
- Synthetic-only Sarvam/OpenAI round trip passed through the private tunnel: final transcript 918ms after input, reply 2303ms, first audio 2575ms, 223680 output PCM bytes. This is one fixture, not a microphone/Pixel quality test or SLA.
- The exact synthetic fixture account, sessions, chat records and test mail were removed; application-wide spend accounting and other accounts were preserved.
- Post-owner-reload HTTPS health/readiness, frontend assets, microphone worklet, anonymous null session, private-data401, CSP and origin controls passed. Public WSS upgrade succeeded and invalid-session start was rejected with close1008. No real microphone or email used in this proxy check.
- An encrypted cold restore/restart of NEW local MongoDB data passed with authorization enabled, expected fixture counts and indexes. No old DynamoDB personal data was exported or migrated.

## Host limits and pending release work

AWS confirms Mumbai EC2 `i-05e7240ff938a2e49`, `t3.medium`, x86_64/AVX, about 2.3GB available RAM after startup and 11GB free/80% disk usage. Root 50GiB gp2 EBS is unencrypted. Amazon Linux 2 standard support ended 2026-06-30; the host has kernel 5.10.179 and Docker 25.0.3. Docker is disabled for boot: container restart policies apply while Docker runs, but a reboot requires administrator action to start Docker. No system upgrade, reboot, boot-service change or unrelated cleanup was performed.

Existing native MongoDB listens on 27017 and broad public rules include that port. Owner explicitly declined restriction and says authentication is enabled. Keep the existing service/rules unchanged; unrelated DB contents/authentication were not audited.

Current SMTP TLS/authentication passed from both laptop and EC2 with no email sent. Owner supplied an AWS Mail Manager SMTP endpoint rather than the initially proposed Mumbai SES SMTP endpoint. Actual recipient delivery and bounce/suppression handling remain unverified. The owner-applied proxy now passes public WSS transport/auth checks. Public production still needs actual browser registration/mail/voice acceptance, supported-host/encrypted-storage review, off-host backup/retention/recovery targets, disk monitoring and administrator-controlled boot behavior. Android source is updated but requires the friend's build and actual Pixel/browser audio acceptance. For the friend's stage Android build, use `API_URL=https://ai_test.satishk.com/api`. No Cognito settings are used in the replacement.

## Owned voice integration — initial release,2026-11-21

Owner authorized staging hosting and immediate app integration in prompt020. Initial owned API/web/voice-worker images used tag `stage-owned-ace419520ce9`, source SHA-256 `ace419520ce9263030f490a82c5ee846cc7f497a45860bf2edd2cda4753425a9`. The later2026-11-22 repair below supersedes these tags; prior releases/images are retained. Images were built from the local working tree, transferred through pinned SSH and verified by image-layer fingerprints. Subsequent documentation edits are not runtime changes. New source/helper changes remain uncommitted/unpushed; do not assume the server Git checkout contains them.

The existing domain/app now routes authenticated web/Android PCM through a private Silero CPU worker for640ms silence endpointing, then manual Sarvam STT and the existing app agent/checked speech backend. Public transport remains HTTPS/WSS, not WebRTC/TURN. Worker has no published port or provider/database keys; private token generated only in the stage env. API/web/worker healthy. MongoDB and Redis kept their17/18-hour uptime; no host Nginx, security-group, public-port or unrelated-service changes.

Initial release was healthy but voice failed at a3200-byte transport boundary. Owner explicitly approved the diagnosed worker limit and pre-existing web mute repairs in prompt021; corrected images redeployed.28 isolated app tests,3 worker tests, web mute contract and public signed-in synthetic/native/browser audio acceptance passed. Correct156 response returned149760 PCM bytes, peak24931; one final-input-chunk → first-audio observation3978ms includes endpoint wait and is not acoustic latency. Browser Secure/HttpOnly session, backend speech events, mute/unmute, Stop, anonymous401 and foreign-origin403 checked. Temporary synthetic account/records removed, no email sent, global spend retained. Actual mic/Pixel, speed, load/reconnect and rollback-drill acceptance remain open.

Release directory: `~/victor-stage/releases/stage-owned-ace419520ce9`; current pointer selects it. Previous private env backup: `~/victor-stage/shared/.env.before-stage-owned-ace419520ce9` (prior owned release), with earlier provider-default backup `.env.before-stage-owned-ee7cec7acafd`. Both are private and outside Git. Layer base+production+owned Compose; use only API/web/worker with `--no-deps` to preserve existing database containers. New `owned-voice-release.mjs` supports reviewed local image build/deploy and container-health rollback; deliberate rollback drill not performed. Updated Git-native helper preserves owned mode after its reviewed changes are committed/pushed. [Full evidence and screenshots](../research/voice-chatbot-2026-11-21/13-staging-owned-voice-integration.md).

## Paused-statement repair — current release,2026-11-22

Owner approved preserving statements across pauses and staging redeployment in2026-11-22 prompt002. Current API/web/worker tag is `stage-owned-4becaff17ef6`; source SHA-256 `4becaff17ef6b9003be81128c3061017211cc6e53968b7878fe724aad7de5e26`. Versioned release/env backup retained, three transferred image-layer fingerprints verified, all containers healthy; database containers kept their23-hour uptime. No active voice sessions immediately before rollout; no proxy, public port, database schema or security-rule change.

Node now preserves delayed finalized transcripts, queues statements in order, lets accepted input processing finish during speech interruption, and suppresses only superseded replies. Batches have stable idempotent IDs; stop/logout still abort and clear unsaved pending work.640ms endpoint, models and authoritative backend data/usage boundaries unchanged. All35 app/retention/auth/database checks passed in a fresh isolated project. The initial live checker timed out, while exact-account inspection verified all three stored facts/history. After separate checker-repair consent in prompt003, a fresh empty synthetic account passed three speech segments with900ms gaps, all three history statements/facts and204480 PCM bytes (peak24622). Both synthetic accounts/records removed; global spend and other accounts preserved; no email sent. Final health200/anonymous profile401 and healthy API/web/worker checked. [Full repair report](../research/voice-chatbot-2026-11-21/14-paused-facts-retention-repair.md). Runtime images come from the working tree, not a new pushed commit.

## Original SSH trust record

The first local key-comparison result was invalid due to a PowerShell automatic-variable collision; SSH refused the malformed trust file and no login occurred. The comparison was corrected, no existing trust match was found, and the owner then verified the actual candidate fingerprint. All successful SSH actions pin `SHA256:tWVvg6Px5vqbad8K7x5AGU+0SjYXFipeZ5b7w6O0VbY` with strict checking. No trust bypass or private-key disclosure was used.
