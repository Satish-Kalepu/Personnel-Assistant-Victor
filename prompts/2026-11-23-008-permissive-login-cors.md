# Permissive login CORS - 2026-11-23

## Prompt
https://ai-test.satishk.com/
login form fails with "Request origin is not allowed."
make cors permissive. allow all origins and headers methods \

## Questions and decisions
- Explicit owner repair instruction authorizes permissive origin/header/method handling and correction of the reported login-origin rejection. Cookie CORS must reflect the requesting origin rather than combine wildcard origin with credentials.
- Inspect current application/library behavior, keep authentication/tenant/data controls, verify meaningful origin/preflight/login behavior, and deploy via the authorized Git staging workflow. No unrelated defect repair or host permission changes inferred.

## Actions
- Reproduced supplied-domain login and foreign-origin OPTIONS403. Read only staging public settings: runtime still uses old underscore canonical hostname.
- Applied authorized CORS/preflight middleware that reflects arbitrary origin/requested headers/methods for credentials; removed app/voice origin filtering, configured all trusted auth origins and explicitly disabled CSRF for the selected policy. Password/session/tenant/usage/cookie attributes and auth route allowlist remain.
- Added focused CORS tests; replaced superseded foreign-origin403 expectation with actual foreign-origin cookie login/profile/sign-out and exercised authenticated foreign-origin voice. Updated active stage check URLs and server preflight test list.
-42 isolated tests pass; preparing canonical server-only setting and authorized all-safe-workspace Git deployment.

## Files changed
- API cors/app/auth/security/voice source, CORS/integration tests, active Git/stage-check helpers, README and idea/task/debt/diary/prompt records. Private canonical server config update will stay outside Git.

## Verification
- TypeScript and versioned local test image builds pass.2 focused and42 full isolated CORS/auth/tenant/voice tests pass. Initial local test sandbox EPERM was resolved by approved execution, not a source repair. Public deployment/live checks pending.

## Outcome
- In progress.
