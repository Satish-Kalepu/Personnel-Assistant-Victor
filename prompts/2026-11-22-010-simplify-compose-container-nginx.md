# Simplify Compose and retain container Nginx — 2026-11-22

## Prompt

okay. leave it.   lets have nginx container in docker-compose.yml  and the  volume /srv/victor-web/current should be mapped.&#x20;
docker compose files are not clear or easy to understand.  make them neat simple static.&#x20;
also name them as  docker-compose.yml&#x20;
Stage and Prod Server may use ALB/NGinx for ssl,   then  the web container nginx gets the request and proxies it to required ports.

## Questions and decisions

- Owner explicitly selects container Nginx with read-only published frontend mount; supersedes host-only proposal.
- Simplify environment configuration and rename Compose files while preserving data volumes, internal service names, private settings and proxy security.
- Implement and validate locally; assess staging preparation through Git and scoped sudo separately from host TLS changes.

## Actions

- Inspected Compose, Nginx, frontend publication and deployment scripts; owner selected container Nginx and one canonical file.
- Replaced normal overlays with docker-compose.yml, kept optional local/owned-voice profiles and isolated renamed test/restore overrides. Retained service/project/volume identities and private internal networks.
- Added server read-only frontend mount and Nginx-only runtime; server Git builder publishes normalized public assets, checks the actual non-root mount, recreates web for symlink changes and supports previous-release rollback.
- Updated local initialization, backup/release helpers and runbooks. Retired the historical HTTPS helper that uploaded local env; private configuration stays server-side.
- First isolated checker used an internal-only web network: Docker assigned no host port, while Nginx started/config validated. Explained the checker defect and requested consent; prompt011 approved the dedicated bridge correction, then routing checks passed.
- Read-only staging check: healthy current release, /srv/victor-web absent, /srv root-owned; no passwordless sudo available. No deployment or host TLS edit performed.

## Files changed

- docker-compose.yml and renamed isolated test/restore files; removed old normal overlays. web/Dockerfile, web/start.sh, web/nginx.conf.template; deploy release/check/init/backup helpers; .env.example; README/runbooks/planning and idea/task/debt/diary/prompt records. No application business logic, private env or user-data changes.

## Verification

- Frontend build, Nginx image build, Compose config for normal/owned/test/restore modes and server Bash/JS syntax checks passed. All18 existing isolated voice regressions passed using the unchanged approved API runtime. The approved corrected real Docker checker passed10 groups: laptop/stage/ALB config/security, read-only non-root mounted assets, index/worklet/referenced assets, missing-file404/SPA fallback, API path/query, actual WebSocket message and trusted/untrusted forwarding. Final image check-only, expected unreadable600-worklet rejection/readable644-worklet acceptance, retained no-build Compose release dry-run and28-file/18-private-value index scan passed (zero secret matches). Git publication pending.

## Outcome

- Implementation and local verification complete; Git publication pending. Staging activation awaits owner-scoped sudo creation of the dedicated public-root directories. Existing app/data/host TLS remain unchanged.
