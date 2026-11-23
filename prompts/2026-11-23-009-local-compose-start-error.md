# Diagnose local Compose startup error - 2026-11-23

## Prompt

local containers are not running.&#x20;
D:\GitRepos\PersonnelAssistant>docker compose up -d &#x20;
and this gives error. what is wrong ?

## Questions and decisions

- Investigate exact Compose configuration error and local container state; no repair changes authorized by this diagnostic question. Use quiet validation to avoid printing private interpolated settings.

## Actions

- Reproduced missing-variable interpolation errors using docker compose config --quiet; no containers changed.
- Explicit --env-file ../PersonnelAssistant.env passes interpolation. Resolved web bind source defaults to absent deploy/.local/web/current; existing web/dist/index.html is present. Parent file omits WEB_ASSET_PATH; local SMTP is externally configured, so no Mailpit/profile change is needed.
- Proposed adding only WEB_ASSET_PATH=./web/dist to external parent settings, then explicit-env build/start and readiness verification; asked repair consent per AGENTS.md, pending.

## Files changed

- This prompt record, notes/ideas.md and dairy.md only. No Compose/env/application repair or container changes. Concurrent CORS edits belong to the ongoing authorized prompt008 work; untouched in this investigation.

## Verification

- Plain Compose config exit1 with missing required env variables; explicit parent env config exit0. Resolved non-secret path check confirms missing default asset directory/existing laptop frontend build. MongoDB and Redis healthy; API/web absent from local docker ps -a.

## Outcome

- Diagnosis complete; requested permission for minimal local env-path repair/startup remains pending. Recommended command after approved path setting: docker compose --env-file ../PersonnelAssistant.env up -d --build. No startup success claimed.
