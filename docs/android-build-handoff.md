ï»¿# Android build handoff

Target: Google Pixel 8a, Android 16+. Share the repository with the friend; no ZIP or provider key is needed. The owner's laptop has no SDK. This update remains source-only until the friend builds and the owner tests it.

Copy this request:

> Please build `android/` from the current repository for my Pixel 8a running Android 16+. Use JDK 17, Android SDK API 36/Build Tools 35.0.0, installed Gradle 8.13, pinned AGP 8.13.2 and Kotlin 2.2.20. There is currently no Gradle wrapper. Copy `victor.properties.example` to `victor.properties` and set the single public API_URL below. Run `gradle :app:assembleDebug`; return `app/build/outputs/apk/debug/app-debug.apk`, its SHA-256 and any errors. Please do not change build settings automatically if it fails. No AWS, Cognito, OpenAI or Sarvam credentials are needed.

For USB local testing:

```properties
API_URL=http://localhost:8080/api
```

On the machine running Docker and connected to the phone:

```text
adb reverse tcp:8080 tcp:8080
```

Without this mapping, localhost means the phone. If the friend builds elsewhere, install the APK and establish the mapping later using Android platform tools. The mapping is lost on disconnect/reboot. For LAN testing, deliberately configure matching APP_ORIGIN, WEB_BIND and API_URL and restrict the firewall. Never expose MongoDB/Redis.

Production uses `API_URL=https://<provided-domain>/api`. Release requires HTTPS; debug alone permits HTTP. Cognito domain/client ID are no longer needed. Provider keys NEVER belong in Android settings or APKs.

Checksum from `android/`:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath app/build/outputs/apk/debug/app-debug.apk
```

Owner acceptance: registration/local Mailpit OTP, login/relaunch, forgot/change password and recovery codes, sign-out, both modes, conversation history/deletion, memory Pending/All/Confirm/correction/local timestamps/pagination, microphone permission/denial, voice mute/interruption/audio routing. Backgrounding, mode/account changes and sign-out must stop capture/stale playback. Sessions use Keystore-managed encryption; app screenshots/backups are disabled. Compilation/device behavior are not verified by source checks.

The [previous handoff](legacy-android-build-handoff.md) is historical and must not be used for the new build.

## Private stage build setting

For the running EC2 preview before the HTTPS domain is supplied, build with `API_URL=http://localhost:18080/api`. On the owner's laptop, establish the stage SSH tunnel and run `adb reverse tcp:18080 tcp:18080`. The friend only compiles; no private keys/provider settings are shared. Rebuild with the supplied HTTPS domain for public staging/production.


Stage HTTPS update (2026-11-21): use `API_URL=https://ai_test.satishk.com/api` for the supplied domain. The app now trusts that origin and uses real SMTP. The earlier loopback/tunnel instructions above describe the initial private deployment; use the HTTPS domain for current stage sign-in. Voice needs the owner-applied Nginx directives in docs/stage-nginx.md and real device acceptance remains pending.

## Local command-line APK built - 2026-11-23

The owner now builds locally using Docker, without Android Studio. A debug APK was successfully built against https://ai-test.satishk.com/api, replacing the earlier underscore staging hostname. OkHttp is pinned to5.4.0 because5.5.1 requiresSDK37 while this project usesSDK36/AGP8.13.2. Java17/Gradle8.13/tools35.0.0 were used.

Local artifact: deploy/.local/android-build/victor-staging-debug.apk (ignored;8312713 bytes). SHA256: 92c5aa934962b2750e316584933b6f7f63a1aeaab932ea45f153cdcf3e9b6ac1. Signature/package/embedded HTTPS URL and18-known-private-value checks passed. Public evidence: research/voice-chatbot-2026-11-21/evidence-android-apk-2026-11-23.json. Debug signing key is retained privately in victor-android-build-cache at /cache/android-user/debug.keystore; preserve that volume for matching future debug updates. SDK cache is victor-android-sdk. Other project containers/caches are unchanged.

This proves compilation and APK inspection, not physical Pixel/audio acceptance. Native UI parity and the known mute-field defect remain DEBT-012. At inspection, the running staging backend still had the old APP_ORIGIN, so native voice config fails the new APK's host check until the separately proposed backend-origin repair is approved/applied.
