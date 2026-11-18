# 2026-11-09 — Execute web route repair

## Prompt

> Yes, execute the reviewed repair

## Questions and decisions

- The owner explicitly approved executing reviewed Mumbai CloudFormation change set `samcli-deploy1794236511`, which moves the browser page/callback to `/v1/web/index.html` and removes the unused slash route.

## Actions

- Executed approved change set `samcli-deploy1794236511` in Mumbai and waited for `UPDATE_COMPLETE`.
- Verified live route authorization, Cognito callbacks, page/assets and signed-out API responses; checked the private Cognito user's status without exposing email or credentials.
- Requested an owner-run signed-in browser smoke test; an attempted browser visual inspection could not start because the browser access host was unavailable.
- Found a stale temporary-password sentence in the Android build handoff that conflicts with the current `CONFIRMED` Cognito status; requested consent before changing it.

## Files changed

- This prompt record, `docs/web-client.md`, `docs/android-build-handoff.md`, `README.md`, `notes/todo.md`, `notes/aws-resources.md`, `notes/deployment-review.md`, `aws-requirement.md`, and `dairy.md`.

## Verification

- Stack `UPDATE_COMPLETE` with 17 resources. `/web` returned 302 to `/web/index.html`; page and three assets returned 200 with the page CSP present. Browser and Android callbacks are both configured. All five personal-data routes use JWT; unsigned GET `/facts`, GET `/messages`, and POST `/chat` returned 401. Cognito authorize page returned 200 for the new callback and its private user is `CONFIRMED`. Browser visual inspection was unavailable; signed-in browser testing is pending owner action.

## Outcome

- The browser page is live. Signed-in browser chat, memory, and logout still need owner testing; no credentials were requested or used. The handoff-note correction awaits separate consent.
