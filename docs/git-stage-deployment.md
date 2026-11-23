# Git-native staging deployment

Owner instruction2026-11-22, [prompt005](../prompts/2026-11-22-005-prefer-git-stage-deployment.md): use Git push/pull for application code and request scoped sudo when a necessary host operation requires it. This supersedes workstation image/env upload procedures.

**Current direction:** Owner selected one `docker-compose.yml`, web-container Nginx and a read-only `<checkout>/deploy/.local/web/current` frontend mount (prompt010). The earlier root-owned worklet403 failure and verified rollback remain historical evidence. The new Git-built publication path normalizes public file modes and checks the exact mount as Nginx before rollout. Local validation and staging image-build preflight passed; owner prompt015 selects app-owned checkout-local publication with no /srv/sudo setup. Staging now runs stage-git-f2f0646806e4-20261122111218 from commitf2f0646; public static/auth and authenticated synthetic voice acceptance passed, original DB containers preserved. See the current stage deployment record. See [Compose deployment](compose-deployment.md).

## Normal release

1. Review all current source/records on local `Stage`, including untracked work and changes from other threads (standing owner instruction prompt027). The default command stages, secret-checks and commits the current non-ignored workspace snapshot automatically. Keep env files, provider/SMTP/database credentials, model caches, virtual environments and private operator state outside Git. Run `node deploy/scripts/verify-staged-secrets.mjs` before committing.
2. Run `node deploy/scripts/deploy-stage.mjs` after reviewing current workspace changes. It pushes `Stage` without force, uses the pinned SSH host key, fast-forward pulls on staging and verifies the expected commit. It executes the deployment script from that Git checkout; it does not upload its local implementation or images.
3. On staging, the pulled script builds versioned API/frontend/Nginx/worker images with the reviewed commit label. The public Silero model is downloaded there and checked against its pinned manifest. Source/model ownership supports the non-root worker. API voice tests and a non-root detector smoke check run before selecting a release. Public frontend output is extracted from the server-built frontend image to a versioned <checkout>/deploy/.local/web/releases directory, normalized to755/644 and checked through the Nginx entrypoint before the current symlink is selected.
4. The server keeps its private `~/victor-stage/PersonnelAssistant.env` (repository-relative `../PersonnelAssistant.env`), updates only image/frontend mount/profile references, retains a private previous-env backup and prior release, validates Compose and restarts only API/web/worker with `--no-deps`. Existing MongoDB/Redis containers/volumes remain in place. Failed container health or static HTTP acceptance restores prior image settings and the frontend symlink; do not prune other images or reset volumes.
5. Verify public readiness, authentication boundaries and an appropriate synthetic voice regression. Record the deployed Git commit, health, test results and limitations. The deliberate rollback drill remains separate acceptance work.

Private runtime env and user data stay on staging. Release Compose files are taken from the server’s pulled checkout. The operator may run public synthetic tests over HTTPS/WSS; those tests are not application deployment or a database migration.

## Privileged host work

Existing app-user Git/Docker/release-directory access does not need sudo. If a required operation fails because it needs root (for example, a specific Nginx change), stop that operation and identify the exact command, file/service, purpose and impact. Request scoped sudo authorization/access before execution. Use an owner-controlled interactive step if authentication is required; never request a sudo password in chat. Do not grant blanket passwordless sudo or work around the operation by uploading workstation artifacts.

## Superseded helpers

- `upload-stage-images.mjs` and `start-stage.mjs` refuse workstation upload/env staging.
- `owned-voice-release.mjs build` remains a local verification build; its `deploy` mode refuses artifact shipping and points to the Git deploy command.
- `sync-stage-repo.mjs` remains a pull-only helper. The default release entry point is `deploy-stage.mjs`.

The host’s previously recorded OS/storage/boot limitations and private-env backup/restore responsibilities remain open. This workflow does not authorize unrelated host repairs.

## Include all current work

Owner instruction2026-11-22, prompt027: do not stop for untracked files or exclude work because another thread created it. deploy-stage.mjs stages all non-ignored repository changes, scans the entire index for private paths/known secret values, commits if needed, pushes Stage without force and pulls/builds the exact snapshot on staging. Env files, credentials and ignored runtime/build outputs stay outside Git. Concurrent edits made after the snapshot are retained for the next release. Existing build/health rollback and explicit repair-consent rules remain; the instruction is staging authorization, not permission to publish secrets or silently repair defects.
