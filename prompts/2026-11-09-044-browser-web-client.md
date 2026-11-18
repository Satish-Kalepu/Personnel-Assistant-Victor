# 2026-11-09 — Browser web client

## Prompt

> meanwhile also create a sample webpage as well which I can seldom use it in browser instead of android app. it should be a simple page can be served by aws serverless resources.

## Questions and decisions

- The owner requested a simple, occasionally used browser alternative to the Android app. Selected existing Mumbai API Gateway/Lambda hosting to avoid new resources and cross-origin configuration; Cognito authorization code with PKCE reuses the current app client.

## Actions

- Inspected backend API, Android sign-in, deployed public connection settings, and AWS documentation for Cognito browser PKCE and SAM public route overrides.
- Added page UI, authentication flow, Personal/Practice chat, history, memory correction/deletion, public route handler, SAM routes, and optional browser callback parameter.
- Prepared nonexecuted CloudFormation change set `samcli-deploy1794235159` for review; no live stack update.

## Files changed

- This prompt record; `backend/web/`, `backend/app/web.py`, `backend/app/handler.py`, `backend/template.yaml`, `backend/tests/test_web.py`, `backend/README.md`, `docs/web-client.md`, `README.md`, `aws-requirement.md`, `notes/ideas.md`, `notes/todo.md`, `notes/tech-debt.md`, `notes/aws-resources.md`, `notes/deployment-review.md`, and `dairy.md`.

## Verification

- Eleven backend tests passed; JavaScript syntax and Python compilation passed; SAM lint and build passed with all three web assets packaged. Processed change set retains JWT on five data routes and makes only three GET page routes public. Live stack remains `CREATE_COMPLETE`.

## Outcome

- Local browser client and reviewable change set are ready. Deployment and signed-in browser testing await execution approval and the owner's separate Cognito first-sign-in completion.
