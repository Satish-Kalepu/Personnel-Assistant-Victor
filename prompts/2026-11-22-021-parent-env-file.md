# Keep primary env outside the repository — 2026-11-22

## Prompt

lets move .env  to parent folder  ( i.e out of repo folder ) , and refer it using "../PersonnelAssistant.env"&#x20;
so .env is safely retained . &#x20;
let me know if this works.

## Questions and decisions

- Owner explicitly selects parent PersonnelAssistant.env for the primary private configuration; preserve values and never display secrets.
- Update local and staging references; staging secrets remain server-side. Inspect destinations and refuse overwriting a different existing file.
- Keep local generated .env.dev separate unless consolidation proves necessary; explain its role. Local parent write requires the normal tool escalation because it lies outside the writable workspace.

## Actions

- Inspect active env loaders, Compose commands, initializers and deployment/backup/secret-scan helpers before moving files.

## Files changed

- Draft updates to init/deploy/backup/secret-scan/demo readers, current runbooks, ignore rules and two guarded migration helpers; prompt/idea/task/diary records. No credential file has been moved or changed.

## Verification

- Parent file already byte-identical to root .env; all29 effective local values match the proposed merge. Existing .env.dev plus ../PersonnelAssistant.env passes Compose config validation, proving the requested parent path resolves. New consolidation guard rejects null-prototype parser output rather than any value difference; stopped before file writes, and repair consent is pending. Updated JS/Bash syntax and provider source leak scan passed. Server old env is0600, new parent absent and app healthy; no server mutation.

## Outcome

- Local migration complete after prompt022 approval: all29 values/rendered Compose and provider reader unchanged; legacy originals archived outside repo and removed from active repo paths. Server relocation/Git publication pending; running containers unchanged.
