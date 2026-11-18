# 2026-11-09 — Approve web route repair

## Prompt

> Yes, make and validate that repair

## Questions and decisions

- The owner explicitly approved changing the browser page and Cognito callback from `/v1/web/` to `/v1/web/index.html`, removing the unused slash route, running local checks, and preparing a nonexecuted change set.
- Execution of the new change set needs a separate decision under `aws-requirement.md`.

## Actions

- Changed `GET /web` to redirect to `/web/index.html`, served that page through the existing asset route, removed the unused slash event, and updated the Cognito callback parameter pattern and `WebUrl` output.
- Ran local checks, built the SAM package, and prepared nonexecuted change set `samcli-deploy1794236511` for review.

## Files changed

- This prompt record; `backend/app/web.py`, `backend/app/handler.py`, `backend/template.yaml`, `backend/tests/test_web.py`, `backend/README.md`, `docs/web-client.md`, `README.md`, `aws-requirement.md`, `notes/todo.md`, `notes/aws-resources.md`, `notes/deployment-review.md`, and `dairy.md`.

## Verification

- Eleven backend tests, JavaScript syntax, Python compilation, SAM lint, and SAM build passed. Change set is `CREATE_COMPLETE` / `AVAILABLE`, removes one unused Lambda permission, and modifies Lambda/API/Cognito client in place. Processed template retains JWT on five data routes and has only `GET /web` and `GET /web/{asset}` public. Live stack remains `UPDATE_COMPLETE` with the old 404 page until execution.

## Outcome

- Owner-approved source repair and reviewable change set are ready. Awaiting separate execution approval under `aws-requirement.md`; no live repair or signed-in browser test yet.
