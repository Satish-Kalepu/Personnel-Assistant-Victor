# Test Nginx reload - 2026-11-21

## Prompt
done test once

## Questions and decisions
- Owner reports the manual domain proxy update is done and requests verification.
- Test public HTTPS, assets, origin enforcement and voice WebSocket upgrade/auth rejection. No configuration repair is authorized by this test request; investigate/report failures before changing application or host settings.
- Use no personal microphone data, real recipient email or live AI calls for the proxy/auth checks.

## Actions
- Tested the public HTTPS domain, frontend assets, origin controls, microphone worklet and voice WebSocket upgrade/authentication rejection after the owner-applied reload.

## Files changed
- This prompt entry, dairy.md, docs/stage-deployment.md, docs/stage-nginx.md and notes/todo.md. Documentation only; no app/host/config/data repairs or runtime changes.

## Verification
- TLS certificate validated; page/ready health returned 200, anonymous session null and private-data request 401. CSP and same-origin microphone policy present.
- Both frontend assets loaded. /voice-worklet.js returned JavaScript containing registerProcessor, not fallback HTML.
- Correct domain-origin empty verification returned expected field-validation400; foreign origin returned403. No email/account created by probes.
- Public WSS /voice upgraded successfully, then rejected the synthetic invalid session and closed1008. No audio/provider calls. Actual authenticated speech/playback, browser microphone/Pixel quality and inbox delivery remain untested by this check.

## Outcome
- Owner-applied Nginx update verified for HTTPS and voice transport/auth protection. No defect found requiring repair.
