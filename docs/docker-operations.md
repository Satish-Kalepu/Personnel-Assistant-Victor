# Docker operations

## Local startup and configuration

Run `node deploy/scripts/init-dev.mjs`, then the Compose command in the root README. The initializer preserves existing provider keys and generated secrets. `.env.dev` holds local secrets; root `.env` supplies provider keys and is loaded last. Only explicit service allowlists reach containers. The operator-only `BACKUP_ENCRYPTION_KEY` is not passed to the app.

`/health/live` checks the API process; `/health/ready` checks MongoDB/Redis. Nginx `/health` proxies readiness for ALB. Required indexes are checked before listening. MongoDB is a single-node authenticated replica set; it supplies transactions, not high availability. Redis uses authenticated AOF persistence, no eviction, bounded memory and expiring voice leases. Durable usage accounting is transactional in MongoDB.

Stopping Compose preserves data. `down --volumes` destroys databases; never use it against development/stage/production as routine deployment. Changing env passwords does not rotate credentials already initialized in persistent volumes.

## Automated checks

Tests use synthetic accounts in an isolated `victor-test` project, actual MongoDB/Redis/Mailpit, and injected model/speech stubs. Test overrides remove provider keys and the Mailpit host port:

```powershell
docker compose --env-file .env.dev --env-file .env -p victor-test -f compose.yml -f compose.dev.yml -f compose.test.yml up -d mongodb mongo-setup redis mailpit
docker compose --env-file .env.dev --env-file .env -p victor-test -f compose.yml -f compose.dev.yml -f compose.test.yml run --rm --no-deps --volume "${PWD}/services/api/test:/app/test:ro" --entrypoint node api --test --test-concurrency=1 test/integration.test.mjs test/voice-session.test.mjs test/voice-sdk.test.mjs
docker compose --env-file .env.dev --env-file .env -p victor-test -f compose.yml -f compose.dev.yml -f compose.test.yml stop
```

27 checks passed: email-first registration, browser/native authentication, tenant/mode separation, source-linked facts and deletion, OTP expiry/replay/attempt limits, password/reset/recovery-code revocation, transactional concurrent quotas, indexed seek pagination including timestamp ties, expiry before TTL removal, global email admission, authenticated/revoked voice, provider protocol and stale-audio/interruption behavior. TypeScript/Vite builds and dependency audits are separate. Stubs do not prove provider quality or real device audio.

## Encrypted MongoDB backup and restore drill

The operator tool streams a full `mongodump --oplog` archive through AES-256-GCM. No plaintext dump is written. Keep a separate protected copy of the backup key and matching configuration: losing the key makes archives unusable. Backups include sensitive auth/session records. This backs up NEW MongoDB data, never the old DynamoDB chats selected for deletion.

```powershell
node --env-file .env.dev deploy/scripts/backup.mjs deploy/.local/current.vbackup
node --env-file .env.dev deploy/scripts/backup.mjs --restore-test deploy/.local/current.vbackup
```

Restore is hardwired to the isolated `victor-restore-test` project. It replaces only that test database. An offline bootstrap on its private network (no published ports/app services) permits restoring admin users without invalidating the tool's auth connection. The script then removes the restore override, re-enables normal keyfile/auth configuration and checks setup completion. Never use `compose.restore.yml` for a live project. The restore is not accepted until an authenticated post-check verifies authorization, data and indexes:

```powershell
Get-Content deploy/mongo/verify-restore.js -Raw | docker compose --env-file .env.dev --env-file .env -p victor-restore-test -f compose.yml -f compose.dev.yml exec -T mongodb mongosh --nodb --quiet --file /dev/stdin
```

Cold restore passed on 2026-11-21: authentication/authorization enabled, expected 1 synthetic user, 10 messages and 4 fact indexes restored. This is fixture evidence, not a production recovery SLA. Stop the isolated project afterward. For production backup use `node --env-file .env deploy/scripts/backup.mjs --production <workspace-relative-output.vbackup>` and arrange encrypted off-host transfer/retention/monitoring once a destination is supplied. A same-host file is not disaster recovery. Agree recovery targets and a production session-invalidation/cutover runbook before public launch. Never improvise restore `--drop` against the live database.

## Stage and production

Stage destination supplied 2026-11-21: `ai_assistant@65.2.130.74`, EC2 `i-05e7240ff938a2e49`, Mumbai, `t3.medium`. Domain/ALB details remain owner-supplied. First inspect host capacity/workloads and verify SSH host identity. Do not overwrite unrelated workloads, host configuration or existing security rules as incidental cleanup.

Production uses `compose.yml` plus `compose.prod.yml`, only production `.env`, new DB/auth/mail/backup secrets, `APP_ORIGIN=https://<domain>` and verified SMTP. Do not load dev/test/restore overrides or expose Mailpit. Startup rejects HTTP, missing provider keys, Mailpit and unauthenticated SMTP in production. Images must have versioned tags and be tested for rollback compatibility. Database/auth/key rotation requires a migration; replacing `.env` alone can invalidate encrypted records or access.

ALB needs ACM/HTTPS, HTTP redirect, an EC2 target group to Nginx, `/health` readiness, WebSocket support and suitable idle/draining timeouts. Restrict app ingress to the ALB security group. `ALB_TRUSTED_CIDR` must contain verified ALB source subnet CIDRs; default loopback is deliberate. Nginx overwrites forwarded client headers and refreshes Docker DNS for API replacement. API trusts one Nginx hop and a configured canonical origin. No public API bypass, MongoDB or Redis ports.

The existing EC2 security group has broad public rules for several services, including SSH/HTTP/HTTPS/8080/FTP/panel ranges. These pre-existing rules are not changed automatically: identify their owners and agree a separate narrowing plan before hardening. Bind any provisional app/mail viewer to loopback until reviewed routing is ready.

SES SMTP Mumbai requires a verified sender/domain, DKIM/SPF/DMARC, production sending access, authenticated TLS (normally 587/STARTTLS), bounce/complaint suppression and delivery tests. Local Mailpit proves flow, not real deliverability. Default global email admissions are 500/UTC day in addition to IP/account limits; monitor saturation/abuse. EC2 EBS encryption, disk/RAM alarms, off-host backups and restore targets remain deployment requirements. One host is a failure domain; ALB/restarts do not provide failover.

## AI/voice and limits

Text/memory defaults to [GPT-6.1 Terra](https://developers.openai.com/api/docs/models/gpt-6.1-terra); voice uses [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna) with reasoning disabled. Models are allowlisted against reviewed request/price bounds; changing to an arbitrary model fails startup. Context is bounded to 24KB and output to 700 tokens. `store: false` does not remove every [OpenAI retention category](https://developers.openai.com/api/docs/guides/your-data). No provider-hosted conversation/vector store is introduced.

Sarvam speech sockets warm while waiting for the model, but text is spoken only after an owned saved reply, confidential-pattern check and budget admission. Shared leases enforce one session/user; login revocation/expiry is checked every three seconds. Audio size, pacing, buffering and timeouts are bounded. Raw audio is not logged or persisted by the application. Keep zero-retention confirmation only for the already-confirmed Sarvam workspace.

Synthetic laptop observations: correct final transcript; first audio after input 5.74s initially, 4.39s without reasoning, then 3.66s with Luna (0.81s to final transcript). These are individual network samples, not real mic/Pixel acceptance or an SLA. Secret-pattern filtering and whole-response latency remain known limitations (DEBT-001/008). Aborted calls may retain conservative reservations; the $50 application guard is not an invoice guarantee or a limit on unrelated provider use.
