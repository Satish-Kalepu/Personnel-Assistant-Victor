# Stage GitHub access - 2026-11-21

## Prompt
ai_assistant user on ec2 server has github key linked. so you can directly push pull

## Questions and decisions
- Owner confirms the stage ai_assistant account has linked GitHub SSH access and authorizes using push/pull for this project deployment.
- Inspect current repository remote/branch and preserve unrelated uncommitted work. Do not put provider keys, database credentials, real env files or private SSH keys in Git.
- Continue the same stage deployment; initial image layer/runtime verification remains required before starting containers.

## Actions
- Verified GitHub SSH access and current Stage branch d91075b, which the owner had already pushed. Cloned the clean Stage checkout into the dedicated server repository directory. Compared all image layers/runtime config through API 1.44 before service startup.
- Committed helper/record updates separately as 79fd23f, non-force pushed Stage, and fast-forward pulled the EC2 checkout to that exact commit. Owner commit preserved; ignored env/private files excluded.

## Files changed
- Nine deployment helpers, proxy fragment, stage/Android/README documentation and factual prompt/idea/task/debt/diary records (29 curated files). No application source changes in this helper commit.

## Verification
- Git ls-remote/clone Stage passed. Five image layer/runtime fingerprints matched; stage services and real provider checks passed. Curated index secret/private-path checks and non-force push/server fast-forward passed. No key values displayed.

## Outcome
- Git push/pull verified end-to-end. App remains healthy with existing verified images and production HTTPS/SMTP settings; host proxy is manually owned.

## Commit verification
- Curated deployment-helper/documentation index passed whitespace, private-path and actual configured secret-value checks (29 files). JavaScript and Bash syntax checks passed. No private env/trust files or app database volumes included. Non-force push and server fast-forward to 79fd23f passed.
