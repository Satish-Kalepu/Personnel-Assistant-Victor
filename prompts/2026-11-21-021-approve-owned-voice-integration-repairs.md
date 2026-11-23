# Approve owned voice integration repairs — 2026-11-21

## Prompt

Reply to: I found an existing web-app mute mismatch: the browser sends `muted`, but the backend expects `value`, so “Mute replies” can end the voice session. May I align the browser message with the backend and verify mute/unmute? This is outside the approved replay fix; AGENTS.md requires separate consent for discovered defects.

Approve the mute correction

Reply to: The staging disconnect is diagnosed: aiohttp rejects frames equal to its 3,200-byte WebSocket limit, while the app sends valid 3,200-byte frames (close code 1009). May I raise the transport limit to 4,096 bytes, keep the application’s 3,200-byte validation, add a full-frame regression check, and rebuild/redeploy? AGENTS.md requires explicit repair consent before this change.

Approve the frame-limit repair and redeploy

## Questions and decisions

- Explicit scoped consent for both diagnosed repairs and rebuilding/redeploying staging. Continue prompt 020; unrelated repairs remain outside scope.

## Actions

- Apply the approved transport boundary and web mute message corrections, add full-frame regression, verify and redeploy versioned images.

## Files changed

- This prompt; web/voice.js, services/voice-worker/worker.py and test_worker.py; linked deployment/evidence/diary records.

## Verification

- Corrected full3200-byte worker regression and web mute/unmute contract passed. Rebuilt/redeployed stage-owned-ace419520ce9. Public signed-in synthetic STT/agent/TTS and actual browser worklet/PCM/mute/Stop/auth checks passed; detailed evidence in report13. Initial staging failure retained. Synthetic account removed and absence checked; no unrelated repair.

## Outcome

- Both scoped repairs applied and verified on staging. Continued integration in prompt020 achieved its stated first-increment criteria; physical mic/Pixel and conversational speed remain open.
