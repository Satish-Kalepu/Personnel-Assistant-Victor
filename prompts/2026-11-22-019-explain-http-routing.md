# Explain current HTTP request routing — 2026-11-22

## Prompt

how me architecture overview now .  how http requests routed  in  simple text

## Questions and decisions

- Explain the deployed staging routing in plain text; no architecture change requested.
- Reuse finalized IDEA-021 and distinguish outer host TLS proxy, Docker port mapping, container routing and private backend services.

## Actions

- Read the deployed release record, host proxy handoff, web Nginx routes and Compose web port/mount definitions.
- Describe HTTPS443 -> host Nginx -> loopback18080 -> web-container8080 -> static files or api3000, including voice WebSocket and readiness routes.

## Files changed

- This prompt, notes/ideas.md clarification and dairy.md only; no runtime/code/configuration changes.

## Verification

- Read-only configuration/release-record inspection; no new tests or deployment needed for this explanation.

## Outcome

- Plain-text overview provided for the current staging HTTP/WSS path and read-only repository-local frontend publication.
