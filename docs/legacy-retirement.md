# Legacy AWS retirement

Approved 2026-11-20 in IDEA-015 and prompts 002/003/007. The owner selected permanent old-chat/memory deletion without export/migration. Local core checks precede retirement; the provided stage EC2/Cloud9 and unrelated DNS/ALB/workloads are excluded.

Read-only preflight verified 17 exact resources in `victor-phase1`, its retained DynamoDB table and monthly account budget, and the SAM support bucket/stack. No standalone DynamoDB backups or AWS Backup recovery points were listed for the table. All 12 artifact versions were reviewed as Victor templates/source packages; no env files were packaged. SAM support exports have no importers. Exact IDs/version manifest are private in ignored `deploy/.local/legacy-review/`.

`deploy/scripts/retire-legacy.ps1` defaults to read-only. With `-Execute`, it pauses old Lambda admission, disables PITR and confirms it, deletes/waits for the stack, explicitly deletes retained table/budget, removes only reviewed artifact versions, then removes empty dedicated SAM support resources. It stops on changed identities/counts, unknown objects/dependencies or new backup copies. Budget removal also removes the old account-wide alerts.

2026-11-21 prerequisites: 27 automated database/auth/tenant/voice checks passed; local API/web image builds, browser registration/login/live OpenAI chat and synthetic Sarvam/OpenAI voice passed. The cold encrypted NEW MongoDB restore now passes with authorization re-enabled, 1 fixture user, 10 messages and restored indexes. This is not a backup of old DynamoDB personal data.

**Execution status: Complete, 2026-11-21.** The exact retirement script completed after its refreshed preflight. Independent API checks verified that the Victor stack, DynamoDB table, Lambda, HTTP API, Cognito pool, execution role, SAM support stack, SAM bucket and Victor-created budget are absent. DynamoDB backup inventory, AWS Backup recovery points and the project log-group listing are empty. PITR was disabled and confirmed before table deletion; no new restorable deleted-table backup was listed. All 12 reviewed S3 artifact versions were removed before the dedicated support resources.

The supplied EC2 `i-05e7240ff938a2e49` remains running at `65.2.130.74`; unrelated Cloud9, DNS and other workloads were excluded. Old API/sign-in/build settings are retired; users must register again on the replacement. No old chats/memory were exported or migrated. Budget removal removes the old account-wide alerts. Other account resources and ongoing EC2 charges remain.

These checks establish resource/API and listed-restorable-copy removal. AWS service/billing metadata or underlying provider retention are not claimed physically erased by application cleanup.
