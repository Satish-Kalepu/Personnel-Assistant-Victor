ÃƒÂ¯Ã‚Â»Ã‚Â¿# Stage deployment record

## Running service - 2026-11-21

Owner supplied `ai_assistant@65.2.130.74` (prompt 001, IDEA-015/TASK-017), explicitly confirmed its ED25519 fingerprint (prompt 003), preserved existing MongoDB/security rules (prompt 004), and authorized GitHub push/pull (prompt 005).

The `victor-stage` project is running under `/home/ai_assistant/victor-stage`. API, web, MongoDB and Redis are healthy; database setup exited successfully. Initial private-stage Mailpit is stopped and its volume preserved; the production-mode app uses real SMTP. New MongoDB/Redis have no published ports. Web binds only `127.0.0.1:18080`; Mailpit viewer only `127.0.0.1:18025`. Existing host services, the stopped unrelated container, native databases and security groups remain unchanged.

The operator SSH tunnel initially provided:

- App: http://localhost:18080
- Stage email viewer: http://localhost:18025

The tunnel is private and temporary. Reopen from this workspace using `node deploy/scripts/stage-tunnel.mjs` if needed; it refuses occupied local ports rather than stopping other processes. The owner subsequently supplied `https://ai_test.satishk.com`: DNS points directly to this EC2 and existing host Nginx already proxies the domain to port 18080. The app now uses that exact HTTPS origin, production Secure cookies and owner-supplied authenticated TLS SMTP. The original localhost-origin rejection (403) is resolved: empty registration validation from the domain now returns the expected 400. The domain proxy still needs the owner-applied WebSocket/client-IP directives in [stage-nginx.md](stage-nginx.md). The localhost app tunnel can be used for readiness, but sign-in should use the HTTPS domain now. There is no ALB in the connected Mumbai account. No DNS, certificate, ALB, target-group or host proxy changes have been made by this deployment.

## Deployment and source

Initial images: `victor-api:stage-20261121-97197a2064f2` and `victor-web:stage-20261121-97197a2064f2`. App source snapshot SHA-256: `97197a2064f2bd31524ce41b438edbcdb72c4b0de7a41276f4e010be388091ef`. All five application/database/mail image filesystems and runtime configurations matched across the laptop and EC2 when compared using Docker API 1.44. Docker 29/containerd identifiers differ from Docker 25 classic identifiers; raw ID equality was therefore not treated as proof of failure or silently waived.

Compose v5.5.1 was verified against Docker's published SHA-256 and installed only in the application's private Docker configuration directory. System Docker 25.0.3 was not upgraded. Real settings are in `~/victor-stage/shared/.env`, mode 600, outside Git and build contexts. Independent stage DB/auth/mail/backup secrets were generated; only required provider keys were copied through verified SSH. No private SSH keys or development database volumes were transferred.

The Git-native build/deploy helper has passed Bash syntax checks; its complete remote-build/rollback path has not been exercised. Initial deployment used the already-verified local images.

The linked GitHub key successfully cloned the `Stage` branch into `~/victor-stage/repository`; application source was already pushed at `d91075b`. Helper/record commit `79fd23f` was non-force pushed and fast-forward pulled successfully on EC2, preserving that user commit. The server checkout refuses dirty changes and uses fast-forward pulls. For a reviewed source update, `deploy/scripts/deploy-stage-from-git.sh` pulls Stage, builds versioned images inside Docker (no host Node upgrade), preserves the private env values/data, and starts the dedicated release with health checks. Previous image settings are retained for rollback; do not prune other images or reset volumes.

## Verification

- 27 real MongoDB/Redis/auth/tenant/quota/voice-protocol tests passed before deployment.
- Actual EC2 registration, local email-code verification, recovery-code enrollment, signed authentication and OpenAI chat passed.
- Synthetic-only Sarvam/OpenAI round trip passed through the private tunnel: final transcript 918ms after input, reply 2303ms, first audio 2575ms, 223680 output PCM bytes. This is one fixture, not a microphone/Pixel quality test or SLA.
- The exact synthetic fixture account, sessions, chat records and test mail were removed; application-wide spend accounting and other accounts were preserved.
- Health/readiness, anonymous null session, private-data 401 response and web/CSP checks passed.
- An encrypted cold restore/restart of NEW local MongoDB data passed with authorization enabled, expected fixture counts and indexes. No old DynamoDB personal data was exported or migrated.

## Host limits and pending release work

AWS confirms Mumbai EC2 `i-05e7240ff938a2e49`, `t3.medium`, x86_64/AVX, about 2.3GB available RAM after startup and 11GB free/80% disk usage. Root 50GiB gp2 EBS is unencrypted. Amazon Linux 2 standard support ended 2026-06-30; the host has kernel 5.10.179 and Docker 25.0.3. Docker is disabled for boot: container restart policies apply while Docker runs, but a reboot requires administrator action to start Docker. No system upgrade, reboot, boot-service change or unrelated cleanup was performed.

Existing native MongoDB listens on 27017 and broad public rules include that port. Owner explicitly declined restriction and says authentication is enabled. Keep the existing service/rules unchanged; unrelated DB contents/authentication were not audited.

Current SMTP TLS/authentication passed from both laptop and EC2 with no email sent. Owner supplied an AWS Mail Manager SMTP endpoint rather than the initially proposed Mumbai SES SMTP endpoint. Actual recipient delivery and bounce/suppression handling remain unverified. Public production still needs the administrator-applied WebSocket/client-IP proxy directives and actual browser registration/mail/voice acceptance, supported-host/encrypted-storage review, off-host backup/retention/recovery targets, disk monitoring and administrator-controlled boot behavior. Android source is updated but requires the friend's build and actual Pixel/browser audio acceptance. For the friend's stage Android build, use `API_URL=https://ai_test.satishk.com/api`. No Cognito settings are used in the replacement.

## Access history

The first local key-comparison result was invalid due to a PowerShell automatic-variable collision; SSH refused the malformed trust file and no login occurred. The comparison was corrected, no existing trust match was found, and the owner then verified the actual candidate fingerprint. All successful SSH actions pin `SHA256:tWVvg6Px5vqbad8K7x5AGU+0SjYXFipeZ5b7w6O0VbY` with strict checking. No trust bypass or private-key disclosure was used.
