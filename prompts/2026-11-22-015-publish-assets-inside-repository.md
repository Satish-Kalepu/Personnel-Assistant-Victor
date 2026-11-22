# Keep published frontend inside designated checkout — 2026-11-22

## Prompt

wait. lets not do it.  it cannot create a  /srv/ folder in server root.  it should be in the codebase/repo location designated to it

## Questions and decisions

- Explicit owner steering cancels /srv directory creation and the pending sudo setup request. Retain container Nginx and Git deployment.
- Publish public build output under repository/deploy/.local/web/releases, select repository/deploy/.local/web/current, and mount only that public subtree read-only. This existing ignored app-owned location keeps private checkout/env/data unserved.
- Update the selected source path, related configuration/tests/runbooks and deploy through Git. No root-directory creation or privileged host change is authorized/needed for this path.

## Actions

- Replace the prior /srv source path and scoped-sudo precondition with guarded app-owned repository-local publication, then verify/deploy.

## Files changed

- docker-compose.yml, .env.example, README.md, deployment/check scripts and current runbooks; idea/task/debt/diary/prompt records. No private env or user data changed locally.

## Verification

- Updated configuration and all10 isolated real Nginx/Compose route/security groups passed; updated server Bash syntax passed. Read-only server check confirms checkout/deploy app-owned and canonical, with DB container IDs/start times recorded and app healthy. Prior18 server voice checks passed; new exact Git rollout and public acceptance pending.

## Outcome

- In progress; prior /srv/sudo request cancelled.
