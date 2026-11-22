# Verify remote staging env outside repository — 2026-11-22

## Prompt

on remote stage server as well put the .env file outside the repo folder. ( your choice )

## Questions and decisions

- Owner reiterates that the remote staging primary env must stay outside the repo and permits choosing its location.
- Previous approved move selected /home/ai_assistant/victor-stage/PersonnelAssistant.env, outside repository/. Verify rather than move or rotate again unnecessarily.

## Actions

- Inspect canonical path, private permissions, compatibility alias, deployment reference and readiness without printing credentials.

## Files changed

- This prompt and diary/discussion records only unless inspection shows additional authorized relocation is necessary.

## Verification

- Verified canonical regular file /home/ai_assistant/victor-stage/PersonnelAssistant.env outside repository/, mode0600, ownerai_assistant; repo/.env absent. Deployment uses $repo/../PersonnelAssistant.env; private shared/.env compatibility alias resolves to it. Parent-only Compose configuration validates and /health returns ready. No secrets displayed.

## Outcome

- Complete. Remote staging already uses the requested outside-repo configuration; no further move, permission change, credential rotation or container restart was necessary.
