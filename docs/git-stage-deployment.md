# Git-native staging deployment

Owner instruction2026-11-22, [prompt005](../prompts/2026-11-22-005-prefer-git-stage-deployment.md): use Git push/pull for application code and request scoped sudo when a necessary host operation requires it. This supersedes workstation image/env upload procedures.

**Current acceptance status:** f8d58dc and approved template fix c06a61a were pushed/pulled and all three images built on staging;18 voice checks and non-root runtime smoke checks passed. Final public-file audit found `voice-worklet.js` root-owned mode600/unreadable (HTTP403). A broader public-asset COPY ownership/readability repair is awaiting explicit approval; do not treat the current Git-built web image as accepted for browser voice. The rollback procedure restored the previous working stage-owned-4becaff17ef6 release: readiness200, worklet200, anonymous profile401. No workstation artifact/env upload or sudo was needed.

## Normal release

1. Review and commit the intended source/records on local `Stage`. Keep env files, provider/SMTP/database credentials, model caches, virtual environments and private operator state outside Git. Run `node deploy/scripts/verify-staged-secrets.mjs` before committing.
2. Run `node deploy/scripts/deploy-stage.mjs` from a clean checkout. It pushes `Stage` without force, uses the pinned SSH host key, fast-forward pulls on staging and verifies the expected commit. It executes the deployment script from that Git checkout; it does not upload its local implementation or images.
3. On staging, the pulled script builds versioned API/web/worker images with the reviewed commit label. The public Silero model is downloaded there and checked against its pinned manifest. Source/model ownership supports the non-root worker. API voice tests and a non-root detector smoke check run before selecting a release.
4. The server keeps its private `~/victor-stage/shared/.env`, updates only image references, retains a private previous-env backup and prior release, validates Compose and restarts only API/web/worker with `--no-deps`. Existing MongoDB/Redis containers/volumes remain in place. Failed container health restores prior image settings; do not prune other images or reset volumes.
5. Verify public readiness, authentication boundaries and an appropriate synthetic voice regression. Record the deployed Git commit, health, test results and limitations. The deliberate rollback drill remains separate acceptance work.

Private runtime env and user data stay on staging. Release Compose files are taken from the server’s pulled checkout. The operator may run public synthetic tests over HTTPS/WSS; those tests are not application deployment or a database migration.

## Privileged host work

Existing app-user Git/Docker/release-directory access does not need sudo. If a required operation fails because it needs root (for example, a specific Nginx change), stop that operation and identify the exact command, file/service, purpose and impact. Request scoped sudo authorization/access before execution. Use an owner-controlled interactive step if authentication is required; never request a sudo password in chat. Do not grant blanket passwordless sudo or work around the operation by uploading workstation artifacts.

## Superseded helpers

- `upload-stage-images.mjs` and `start-stage.mjs` refuse workstation upload/env staging.
- `owned-voice-release.mjs build` remains a local verification build; its `deploy` mode refuses artifact shipping and points to the Git deploy command.
- `sync-stage-repo.mjs` remains a pull-only helper. The default release entry point is `deploy-stage.mjs`.

The host’s previously recorded OS/storage/boot limitations and private-env backup/restore responsibilities remain open. This workflow does not authorize unrelated host repairs.
