# Keep stage env outside repository ? 2026-11-22

## Prompt

also do not keep .env.stage in repo directory. move to parent  as  PersonnelAssistant.env.stage

## Questions and decisions

- Explicit owner instruction moves the existing local .env.stage to ../PersonnelAssistant.env.stage and updates references. Refuse a different existing destination rather than overwrite it.
- Server primary active env remains the already verified ../PersonnelAssistant.env. Inspect whether a separate repo/.env.stage exists remotely; do not copy workstation secrets there.
- The unrelated voice visual-test correction remains pending and is not approved by this file-location instruction.

## Actions

- Inspect references and file existence/equality without displaying credentials.

## Files changed

- deploy/scripts/init-stage.mjs, build-stage-images.mjs and verify-staged-secrets.mjs; current env runbook, prompt/idea/task/diary/evidence records. Private file moved locally outside repo; no private contents committed.

## Verification

- Before/after SHA256 match and root .env.stage absent; parent initializer preserves existing settings, parent-file Compose config and JS syntax checks pass. Remote has no repo/.env.stage or separate parent stage variant; existing outside-repo primary PersonnelAssistant.env0600 remains healthy. No credentials printed/transferred.

## Outcome

- File move and reference validation complete; scoped Git publication pending. Existing server configuration and voice rollout gate unchanged.
