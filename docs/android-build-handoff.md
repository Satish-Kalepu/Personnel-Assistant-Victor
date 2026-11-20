# Android build handoff

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
