# API Gateway voice option - 2026-11-20

## Prompt
Reply to the question about Sarvam Model APIs retention:
Yes, Model APIs retention is 0 days

Reply to the question about reusing the existing Mumbai server:
why can't we use apigateway instead of ec2 instance ?

## Questions and decisions
- Owner confirmed Model APIs zero-day retention. Record as owner confirmation, not an independently inspected account setting. Do not ask again.
- Owner questions API Gateway versus EC2; this does not approve reusing the existing instance.
- Investigate API Gateway WebSocket plus on-demand compute; do not treat EC2 or an always-on container as mandatory.

## Actions
- Verified official AWS HTTP/REST streaming, WebSocket routing/quotas/binary-frame limits, Lambda duration, Lambda Web Functions limitations, and usage-based API Gateway billing.
- Documented the serverless option in docs/voice-api-gateway-option.md and recorded IDEA-014 as Discussing. Corrected the architectural implication that EC2/always-on hosting is mandatory; the current server requires refactoring to a different transport/session design.
- Recorded owner zero-retention confirmation and updated TASK-013/deployment notes. Did not approve or access the existing server for reuse.

## Files changed
- prompts/2026-11-20-001-api-gateway-voice-option.md
- docs/voice-api-gateway-option.md
- docs/voice-deployment-review.md
- docs/voice-research-2026-11-19.md
- notes/ideas.md (IDEA-014 and IDEA-013 setup update)
- notes/todo.md (TASK-013 prerequisite status)
- dairy.md
- No application code, private env file, AWS resource or provider setting changes.

## Verification
- Official AWS docs confirm two-hour WebSocket client connection duration, 29-second per-integration timeout, conventional 15-minute Lambda worker maximum, base64 workaround for unsupported incoming binary frames, and per-message/connection-minute billing.
- Lambda Web Functions are not a drop-in WebSocket server host: inbound upgrade unsupported and HTTP path half-duplex.
- This is a feasibility/design review, not a deployed proof or smoothness/cost benchmark. No tests run because no application changes; prior gateway/voice checks are not proof of the proposed serverless transport.
- Zero retention is confirmed by the owner; no account UI inspection performed.

## Outcome
- EC2 is not mandatory. Explain the current HTTP API versus a separate WebSocket API and the need for backend compute holding the Sarvam connection. Recommend prototyping on-demand Lambda coordination before committing to always-on hosting.
- Architecture remains Discussing; no instance reuse or deployment approved. Voice remains not live. User retention confirmation resolved; do not ask again.
