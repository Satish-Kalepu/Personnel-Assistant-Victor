# Integrate owned voice server on staging — 2026-11-21

## Prompt

go ahead.  and lets host on staging environment.&#x20;
and start integrating this rightaway in our personnel assistant app .

## Questions and decisions

- Explicit consent to the previously proposed browser fixture trailing-silence correction, staging hosting and immediate Personnel Assistant integration.
- Selected first staging increment: existing authenticated web/Android WSS PCM → private Silero worker → manual streaming STT → existing app agent/checked TTS. Standalone local WebRTC remains separate; public TURN/UDP rollout and streamed-reasoning policy change are deferred explicitly. Existing app identity/mode/memory and owner-preserved host/security boundaries retained.

## Actions

- Applied approved two-second trailing silence to standalone browser fixture; verified turn completion/Stop/End. Preserved initial failure; browser energy sample inconclusive, independent media tests and later live app PCM provide nonzero-audio evidence.
- Built private token-protected bounded CPU VAD worker, Node manual-STT adapter, configurable provider/owned mode, UI speech activity, Compose overlay, versioned image/rollback helper, synthetic stage checker and future Git deploy support.
- Inspected dedicated EC2 capacity/workloads through existing pinned SSH. Built3 images and matched transferred layer fingerprints; deployed only API/web/worker while preserving running DBs, proxy, security rules and unrelated workloads.
- First stage voice failed1009 on full3200-byte input; read-only diagnostics isolated aiohttp’s equal-limit rejection. Separately found existing web mute key mismatch. Requested explicit scoped repair consent; prompt021 approved both, then corrections/regressions/rebuild/redeploy completed.
- Final stage release stage-owned-ace419520ce9 healthy. Public native-style and isolated browser synthetic voice, mute/Stop and origin/auth checks passed. No emails sent; exact synthetic account/data removed; global spend retained. Local test containers/QA broker closed, staging remains running.

## Files changed

- services/voice-worker; API config/voice adapter/session/config response; web voice activity/mute; compose.owned-voice.yml; .gitignore; deployment/check helpers and updated Git helper; research evidence/screenshots/report13; linked idea/task/debt/diary/stage/prompt records. Existing unrelated working-tree changes preserved. No Git commit/push in this turn.

## Verification

-28 isolated app/auth/tenant/voice checks,3 worker checks including full-frame acceptance, web mute contract, TypeScript/Vite/image builds, JS/Bash syntax, source-key absence and diff whitespace passed. Default sandbox blocked Bash spawn; escalated parser succeeded without configuration change.
- Public synthetic transcript correct, reply156,149760 nonzero PCM bytes/peak24931; first PCM3978ms after final synthetic input chunk in one run. Browser actual worklet/WSS/PCM scheduled peak0.71185, mute true/false without disconnect and Stop passed. Secure/HttpOnly cookie, config/profile401, foreign-origin403, worker no-token401, health200; desktop/mobile screens visually reviewed with no horizontal overflow.
- Actual microphone/Pixel/acoustic/performance/load/reconnect/rollback-drill acceptance not claimed. Application’s checked full-reply gate and usage limits retained. Database uptime preserved and fixture removal verified; no real account data read.

## Outcome

- Hosted and integrated first owned-VAD staging increment, with approved repairs verified. TASK-018/019 complete for stated scope; DEBT-012/physical/speed and further streamed-reasoning work remain open. No new key/subscription required. Staging URL https://ai_test.satishk.com; current code remains reviewable in working tree, deployed images identified by source hash.
