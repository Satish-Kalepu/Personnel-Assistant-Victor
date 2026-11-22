# One Compose stack

Owner decision: 2026-11-22, prompt010. The supported application stack is **docker-compose.yml** at the repository root. Local, staging and production use this same readable file; private environment values select origin, credentials, image versions, published port and frontend directory. There are no dev/stage/prod/owned-voice overlay chains, YAML anchors, reset tags or generated Compose files.

```text
Browser / Android
  -> ALB or host Nginx (HTTPS/WSS, servers only)
  -> web container Nginx :8080
       /           -> read-only frontend build
       /api/*      -> api:3000, preserving path and query
       /voice      -> api:3000, WebSocket upgrade
       /health     -> api:3000/health/ready
                         -> voice-worker:4320 (private, owned voice profile)
                         -> mongodb:27017 / redis:6379 (private)
```

Only web publishes an application port. MongoDB, Redis, the API and voice worker do not. The `data` network is internal; API also uses `edge` for provider/email access. Existing service names, project names and persistent volume keys are retained. Do not rename the existing staging project `victor-stage` or recreate databases to adopt the new filename.

## Frontend mount

Checkout-relative default (server env records the absolute path):

```yaml
source: ./deploy/.local/web/current
target: /usr/share/nginx/html
read_only: true
bind:
  create_host_path: false
```

`WEB_ASSET_PATH=./web/dist` selects the laptop build instead. The explicit no-create setting rejects a missing published directory. The web image contains Nginx/configuration, not the frontend; its named Docker build target `build` produces the frontend separately. Never mount the Git checkout, private env or user data as the web root.

On servers, Git-built public files go into `<checkout>/deploy/.local/web/releases/<release>` with 0755 directories and 0644 files. `current` is a symlink selected by the app owner. The actual non-root Nginx entrypoint checks all files and required index/worklet/assets, then validates its config before serving. Recreate web after changing the symlink so Docker binds the new release. Retain the old directory and matching API image for rollback; a symlink update alone is not a running-container release.

## Laptop

Docker Desktop with Linux containers and Node 24+ are required. From the repository root:

```powershell
node deploy/scripts/init-dev.mjs
npm --prefix web ci
npm --prefix web run build
docker compose --env-file .env.dev --env-file .env up -d --build
```

Open http://localhost:8080 and local email at http://localhost:8025. The initializer adds `WEB_ASSET_PATH=./web/dist` and `COMPOSE_PROFILES=local` if absent and preserves private settings. Local SMTP values in `.env.dev` must point to Mailpit: host `mailpit`, port1025, secure false, empty SMTP user/password. Root `.env` is loaded last for private provider keys; it must not accidentally override local mode/origin/SMTP settings with server settings.

Frontend edits require `npm --prefix web run build`; there is no Vite proxy setup in this selected mode. Normal rebuilds appear through the local directory mount. Use `docker compose --env-file .env.dev --env-file .env stop` to stop without deleting data.

Optional owned VAD uses the same file: privately set `VOICE_ENDPOINT_MODE=owned`, a generated 32+ character `VOICE_GATEWAY_TOKEN`, and `COMPOSE_PROFILES=local,owned-voice`. Fetch the pinned model first with `python services/voice-worker/fetch_model.py` (Python3), then build/start. Existing local provider endpoint mode remains the default; staging already uses owned VAD. The local profile is only a mail viewer; server deployments must not enable it.

## Staging and production

Keep settings on each server. Both require `NODE_ENV=production`, an exact HTTPS `APP_ORIGIN`, production provider/SMTP configuration, unchanged database/auth secrets and reviewed versioned image references. Set `WEB_ASSET_PATH=<checkout>/deploy/.local/web/current`. For owned VAD use `VOICE_ENDPOINT_MODE=owned`, `COMPOSE_PROFILES=owned-voice`, a private worker token and `VOICE_WORKER_IMAGE`.

For the current staging host, retain `WEB_BIND=127.0.0.1`, `WEB_PORT=18080` and its verified proxy CIDR. Existing host Nginx continues to terminate TLS and forward to the web container. **No host-only static/API snippet, new API host port, TLS edit or reload is needed.** The earlier host-only proposal is superseded.

For a future ALB target, bind web to the server's private interface, allow ingress only from the ALB security group, and set `ALB_TRUSTED_CIDR` to the verified proxy source subnet. Never trust all addresses. The existing variable name also applies to host Nginx; Docker may present the host proxy through a bridge gateway rather than 127.0.0.1, so inspect the real peer address. Nginx accepts forwarded client IP/HTTPS only from that configured proxy, overwrites upstream client headers, and the API trusts just the web Nginx hop. Outer proxies must support WebSocket upgrades and an idle timeout suitable for voice. The app uses its canonical HTTPS origin for production cookies/authentication.

### App-owned publication directory

Owner steering2026-11-22, prompt015 supersedes the earlier /srv proposal. Public build output stays inside the designated Git checkout under deploy/.local/web/releases; current selects a retained release. deploy/.local is ignored by Git and excluded from application build contexts. The app user creates these directories without sudo. The publisher checks the canonical path and rejects unexpected symlink traversal before writing.

Only the selected public release is mounted at /usr/share/nginx/html. Other checkout files, private env and database contents are not mounted or served. The script sets WEB_ASSET_PATH to the absolute checkout-local current path in the existing server env so a retained Compose release directory resolves the same publication root. The Nginx runtime reads normalized755/644 public files through the mount; private checkout parent permissions remain unchanged. Do not create /srv directories or request root privileges for this deployment.

### Git releases

Use `node deploy/scripts/deploy-stage.mjs` from a clean, reviewed Stage checkout. It pushes/pulls the expected commit and runs the pulled server-side builder. The builder builds API, frontend, Nginx and enabled worker; runs existing voice tests; extracts only public dist on that server; normalizes modes and checks the exact mount as the Nginx user. It then updates only image/frontend/profile references in the server env and recreates API/web/worker with `--no-deps`, preserving DB containers/volumes.

The script checks readiness and real index/worklet/build asset responses before selecting the app release. On a rollout failure it restores env, previous frontend selection and matching containers; transitional rollback understands the retained old Compose filenames. Keep old image/asset releases and perform normal public auth/voice acceptance. This single-host rollout has a short app interruption and is not zero downtime or high availability. Production requires its own reviewed release/rollback process; the provided deployment CLI targets staging only.

## Verification and operator-only overrides

`docker-compose.test.yml` and `docker-compose.restore.yml` are **only** isolated test/restore overrides; normal application startup uses no overrides. Keep `victor-test` / `victor-restore-test` separate from live projects. See [Docker operations](docker-operations.md).

After building `victor-web:compose-review` and `web/dist`, run `node deploy/scripts/check-compose-nginx.mjs` for an isolated real Nginx check: config/security for laptop/stage/ALB, read-only mount, static/worklet/MIME responses, missing-asset handling, HTTP path/query, WebSocket exchange, and trusted/untrusted forwarded headers. It creates/removes only its own temporary mock API, web container and dedicated bridge network; no provider calls or existing app/database changes.

Primary references: [Compose services and mounts](https://docs.docker.com/reference/compose-file/services/), [Nginx trusted client addresses](https://nginx.org/en/docs/http/ngx_http_realip_module.html), [WebSocket proxying](https://nginx.org/en/docs/http/websocket.html).
