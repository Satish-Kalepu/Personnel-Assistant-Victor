# Stage GitHub access - 2026-11-21

## Prompt
ai_assistant user on ec2 server has github key linked. so you can directly push pull

## Questions and decisions
- Owner confirms the stage ai_assistant account has linked GitHub SSH access and authorizes using push/pull for this project deployment.
- Inspect current repository remote/branch and preserve unrelated uncommitted work. Do not put provider keys, database credentials, real env files or private SSH keys in Git.
- Continue the same stage deployment; initial image layer/runtime verification remains required before starting containers.

## Actions
- Verified GitHub SSH access and current Stage branch d91075b, which the owner had already pushed. Cloned the clean Stage checkout into the dedicated server repository directory. Compared all image layers/runtime config through API 1.44 before service startup.
- Preparing a separate commit for deployment-helper/record updates without changing the owner commit or including ignored env/private files.

## Files changed
- This prompt entry and deployment records as work progresses.

## Verification
- Git ls-remote/clone Stage passed. Five image layer/runtime fingerprints matched; stage services and real provider checks passed. Staged secret-value checks/push result will be recorded before completion. No key values displayed.

## Outcome
- GitHub capability accepted; deployment continues.

## Commit verification
- Curated deployment-helper/documentation index passed whitespace, private-path and actual configured secret-value checks (29 files). JavaScript and Bash syntax checks passed. No private env/trust files or app database volumes included. Non-force push and server fast-forward verification follow.
