# 2026-11-09 — Execute browser change set

## Prompt

> Yes, execute the reviewed change set

## Questions and decisions

- The owner explicitly approved execution of reviewed Mumbai CloudFormation change set `samcli-deploy1794235159` for the occasional browser client.

## Actions

- Executed approved change set `samcli-deploy1794235159`; stack reached `UPDATE_COMPLETE` with 18 resources.
- Read-only verification found all five personal-data routes still use JWT and the new web routes are public. Cognito has both Android and browser callback URLs.
- Found a deployment defect: API Gateway lists `GET /web` and `GET /web/{asset}` but not `GET /web/`; live `/web/` returns 404 while `/web` redirects there. Proposed serving `index.html` through the working asset route and moving the callback to `/web/index.html`. No repair has been made.

## Files changed

- This prompt record, `notes/deployment-review.md`, `docs/web-client.md`, `notes/todo.md`, `notes/aws-resources.md`, `aws-requirement.md`, `README.md`, and `dairy.md`.

## Verification

- CloudFormation `UPDATE_COMPLETE`, 18 resources. Live route listing shows JWT on five data routes and NONE on web routes; Cognito callbacks include both browser and Android URLs. HTTP checks: `/web` 302 to `/web/`, `/web/` 404, three web assets 200, signed-out `/facts` 401.

## Outcome

- The approved update deployed, but the browser page cannot load because its callback URL returns 404. Awaiting explicit owner consent for the proposed routing repair and a separate reviewed change set.
