# Rebuild APK for corrected staging domain - 2026-11-23

## Prompt

fyi. updated stage domain to   ai-test.satishk.com because  underscore in  domain name having issues in SSL handshare.&#x20;
rebuild apk with required stuff

## Questions and decisions

- Owner supplies corrected staging HTTPS domain and explicitly asks to rebuild with required changes; apply the already diagnosed/proposed OkHttp5.5.1 to5.4.0 compatibility repair within that rebuild scope. SDK36/AGP8.13.2/Java17 retained.
- Build native baseline debug APK locally in isolated Docker; no Android Studio. Use https://ai-test.satishk.com/api and verify embedded URL/signature. No native UI parity or unrelated mute repair inferred.

## Actions

- Applied approved one-line OkHttp5.4.0 compatibility repair and rebuilt isolated staging APK with corrected domain; original ignored laptop settings untouched.
- Found running backend APP_ORIGIN still old; source confirms browser origin rejection and returned voice URL mismatch. Explained impact and requested separate consent for external APP_ORIGIN/check-script/Git rollout repair; pending.

## Files changed

- android/app/build.gradle.kts; docs/android-build-handoff.md; research/voice-chatbot-2026-11-21/evidence-android-apk-2026-11-23.json; notes/ideas.md, notes/todo.md, notes/tech-debt.md, dairy.md and this prompt. Ignored APK/build script/config/reports under deploy/.local/android-build.

## Verification

- Docker assembleDebug succeeded:37 tasks,3m45s. APK8312713 bytes, SHA25692c5aa934962b2750e316584933b6f7f63a1aeaab932ea45f153cdcf3e9b6ac1.
- Package com.victor.assistant v0.2.0/code2, compile36/min28/target35; debug v2 signature valid, signing key retained in private Victor cache. New API URL present, old domain absent from3 DEX files;79 ZIP entries checked against18 known private values,0 matches.
- New domain TLS/readiness/anonymous-session/private-data/CSP passed. Running server origin still old; backend repair approval pending. No device installation/audio acceptance claimed.

## Outcome

- APK build complete and verified locally. Backend-origin configuration repair remains separately pending approval; no silent server/TLS/database changes.
