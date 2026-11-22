# Keep primary env outside the repository — 2026-11-22

## Prompt

lets move .env  to parent folder  ( i.e out of repo folder ) , and refer it using "../PersonnelAssistant.env"&#x20;
so .env is safely retained . &#x20;
let me know if this works.

## Questions and decisions

- Owner explicitly selects parent PersonnelAssistant.env for the primary private configuration; preserve values and never display secrets.
- Update local and staging references; staging secrets remain server-side. Inspect destinations and refuse overwriting a different existing file.
- Consolidate local generated .env.dev defaults and primary .env overrides into the retained parent file, preserving all29 values and old precedence; keep exact legacy archives outside repo. Parent-folder writes used the normal tool escalation because they lie outside the writable workspace.

## Actions

- Inspected local/staging env readers and destination paths. Parent local file already matched root .env bytes; all29 effective settings were preserved when combining .env.dev + .env with old precedence.
- Initial new migration guard rejected the parser object's prototype, with0 changed values and no writes. Explained diagnosis and waited for explicit prompt022 correction consent. Corrected both key/value checks, then verified identical rendered Compose before selecting the parent file and archiving old bytes outside the repo.
- Updated initializer, deployment/backup/scan/demo paths and runbooks; initializer preserves existing parent settings. Git guard ignores accidental in-repo copies and scans the external values without printing them.
- Reviewed/scanned and non-force pushed commitf5418ea; exact fast-forward pulled on staging. Ran only the pulled server migration helper: relocated its existing private settings within that host and retained a compatibility symlink for old releases. No workstation credentials/data copied.
- Verified server Compose identical, parent file0600, all five API/web/worker/MongoDB/Redis container IDs/start times unchanged and readiness healthy. No container rebuild/restart needed for an equivalent loader-path move.

## Files changed

- Init/deploy/backup/secret-scan/demo readers, current runbooks, ignore rules and two guarded migration helpers; prompt/idea/task/diary/evidence records. Local active credentials moved to the parent file with exact legacy archives; server active credentials relocated only on that server. No application business logic or running-container change.

## Verification

- Local: all29 parsed values and full rendered Compose match previous split files; new single env-file command passes config --quiet. Exact old bytes archived outside repo; initializer preserves new file, demo provider reader matches and source leak scan passes. JS/Bash syntax passed.22-file/18-private-value Git index scan:0 matches.
- Server: old/new rendered Compose objects identical; requested parent location selected mode0600, compatibility alias verified, all five container identities/start times unchanged, /health ready. No secrets printed or transferred from laptop. Evidence under research/voice-chatbot-2026-11-21/evidence-parent-env-local-2026-11-22.json and evidence-parent-env-stage-2026-11-22.json.

## Outcome

- Complete. Both environments use ../PersonnelAssistant.env outside their repo, retaining existing settings and app state. Explicit --env-file remains required; no in-repo catch-all env injection added. Historical local .env.stage/legacy service settings were not part of active primary-file relocation.
