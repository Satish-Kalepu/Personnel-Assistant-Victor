# Approve isolated checker network correction — 2026-11-22

## Prompt

Approved the isolated checker network correction: “Approve checker network correction”. The approved question proposed changing only its temporary web network to a normal private Docker bridge, matching the app edge network, and rerunning it. No live containers or data are in scope.

## Questions and decisions

- Explicit consent for this checker defect under AGENTS.md; implementation scope remains prompt010 / IDEA-021 / TASK-022.

## Actions

- Change only the temporary checker network from internal-only to a normal dedicated bridge, then rerun the isolated check.

## Files changed

- deploy/scripts/check-compose-nginx.mjs; prompt010/011, diary and task verification records.

## Verification

- Corrected checker passed10 real Docker acceptance groups, including actual HTTP/WebSocket routing and trusted/untrusted forwarding. Temporary fixtures cleaned up.

## Outcome

- Approved correction applied and verified. Main configuration work continues under prompt010; staging deployment is not claimed.
