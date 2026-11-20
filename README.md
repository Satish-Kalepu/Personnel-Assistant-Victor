ï»¿# Victor

A private-account personal assistant for the browser and Android. The supported application uses Docker Compose, a modular Node/TypeScript API, MongoDB, Redis and Nginx. OpenAI handles chat/memory; Sarvam handles streaming speech. There is no CloudFormation/serverless deployment in the new workflow.

## Run locally

Install Docker Desktop with Linux containers and Node 24+ (the application itself runs in containers). From the repository root:

```powershell
node deploy/scripts/init-dev.mjs
 docker compose --env-file .env.dev --env-file .env -f compose.yml -f compose.dev.yml up -d --build
```

Open **http://localhost:8080**. Register, open **http://localhost:8025** to read the local email code, complete registration and privately save the recovery codes. Sign in with your password. Local emails stay in Mailpit; they are not sent to real mailboxes.

The initializer preserves root `.env`. Keep `OPENAI_API_KEY` and `SARVAM_API_KEY` there. `.env.dev` contains generated local database/auth/backup secrets and is ignored. `.env.example` documents shareable placeholders. Never share real env files, print expanded Compose configuration, or put keys into browser/Android settings.

The API/web images build locally; MongoDB, Redis and Mailpit use pinned upstream images. MongoDB/Redis have no published host ports. Browser voice requires microphone permission and a supported browser; localhost is allowed, production needs HTTPS. Start/Stop voice, Stop speaking and Mute are available. Ambient recording and wake words are separate future features.

```powershell
 docker compose --env-file .env.dev --env-file .env -f compose.yml -f compose.dev.yml ps
 docker compose --env-file .env.dev --env-file .env -f compose.yml -f compose.dev.yml stop
```

Stopping preserves data. Do not use `down --volumes` on development or production unless you intend to destroy its databases. Changing env passwords after volumes exist does not rotate the existing database credentials.

## Accounts and limits

Public registration creates a private personal account after email verification. Login uses a password. Email OTP and one-use recovery codes support password recovery; change-password and sign-out revoke sessions. Security questions and Cognito are removed from supported clients. Personal and English Practice remain separate; persistence and voice use verified tenant identities.

Defaults: 20 chat turns, 300 voice seconds per account per UTC day, one active voice session/account, and a $50/month application AI reservation guard. Public email admission has a configurable global daily cap. Failed/aborted calls can retain conservative reservations; this is not a guaranteed final invoice cap. Infrastructure/email costs and unrelated provider account usage are separate.

Do not send passwords/account credentials in chat. Secret-pattern holds remain imperfect (DEBT-001); this is not a credential vault. OpenAI `store: false` does not by itself establish zero retention. Processing outside Mumbai is owner-approved; Sarvam Model APIs zero-day retention is owner-confirmed.

## Verification and operations

See [Docker operations](docs/docker-operations.md) for isolated tests, encrypted backup/restore and EC2/ALB release requirements. [Android handoff](docs/android-build-handoff.md) gives the friend the single public API setting. No source ZIP is needed. Actual Android compilation and Pixel/browser microphone quality are separate from backend tests. Remote deployment awaits supplied access/domain and production email setup.

The approved [architecture plan](docs/docker-mongodb-saas-plan.md), [tasks](notes/todo.md) and [known debt](notes/tech-debt.md) track acceptance. Legacy `backend/`, `voice-gateway/` and SAM files preserve historical source/uncommitted work; they are not the supported deployment path. The [former README](docs/legacy-serverless-readme.md) is historical. Check the [retirement record](docs/legacy-retirement.md) for old AWS deletion status; do not use its old URLs/build settings.

## Stage preview

The service is running privately on the supplied EC2. With the operator's verified SSH tunnel, open http://localhost:18080 and read stage verification emails at http://localhost:18025. See [stage deployment record](docs/stage-deployment.md) for the exact release, verification and remaining domain/ALB/production-email requirements. No public endpoint is claimed yet. Existing host databases/security rules were preserved per owner choice.

Stage domain: **https://ai_test.satishk.com/**. The app is configured for HTTPS and supplied SMTP; the owner is applying the voice proxy settings in [the Nginx handoff](docs/stage-nginx.md). Use the domain for stage sign-in; the earlier localhost tunnel was the initial private preview. Real inbox and device audio acceptance remain open.
