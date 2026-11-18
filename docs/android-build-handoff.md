# Android Phase 1 build handoff

Victor's Phase 1 backend is deployed in AWS Mumbai. The Android source has not yet been built or tested on a device.

## Owner and builder arrangement (2026-11-18)

- **Target device:** Google Pixel 8a, Android 16 or later. Record the exact installed version during testing; later Android versions still need their own checks.
- **Builder:** The owner's friend. The owner's laptop has no Android SDK and does not need one to receive and install the APK.
- **Handoff:** Share `handoffs/victor-android-source-2026-11-18.zip`. Extract it locally; this guide is included beside the `android/` project.
- **Configuration:** The package includes only the three public app settings in `android/victor.properties`: API URL, Cognito domain, and public client ID. The builder does not need AWS access, SSO credentials, or the owner's Victor password.
- **Return:** Send the owner `app-debug.apk`, its SHA-256 checksum, and the build result. The owner signs in personally after installation.

## Prepare Android Studio

1. Open the `android/` directory as a Gradle project. Use JDK 17 and install Android SDK API 36 and SDK Build Tools 35.0.0. The source pins Android Gradle Plugin 8.13.2 and Kotlin 2.2.20. Use Gradle 8.13 for this handoff; see the [official AGP compatibility table](https://developer.android.com/build/releases/agp-8-13-0-release-notes).
2. Place `victor.properties` in the `android/` directory. The owner's current workspace has this git-ignored file filled with the deployed **public** API URL, Cognito domain, and public client ID. If building from a fresh clone, copy that file from the owner or fill `victor.properties.example` using the `victor-phase1` CloudFormation outputs. Do not add the file to version control.
3. Sync Gradle, build a debug APK, and privately install it on the owner's Android phone. Record the device model and Android version for the validation notes.

## Build and return the APK

This source currently has no Gradle wrapper (`gradlew` / `gradlew.bat`). Install [Gradle 8.13](https://gradle.org/releases/) on the builder's machine and make it available on PATH. In Android Studio, select that local Gradle installation if prompted. Set Gradle's JDK to 17 and set the Android SDK location through Android Studio or the builder's own unshared `local.properties`.

From the extracted `android/` directory, run:

```text
gradle --version
gradle :app:assembleDebug
```

The first build needs internet access to download dependencies. The expected APK is `android/app/build/outputs/apk/debug/app-debug.apk`, relative to the extracted package root. This is a private test build, not a Play Store release.

On Windows, generate its checksum from the `android/` directory with:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath app/build/outputs/apk/debug/app-debug.apk
```

Return the APK, checksum, Gradle/JDK versions, and whether the build succeeded. If it fails, share the relevant error without credentials; discuss any dependency or build-setting changes before applying them. Keep the same builder/debug signing key for subsequent test APK updates.

The owner transfers the APK to the Pixel 8a, opens it, and permits installation from that source if Android asks. No SDK or AWS CLI is required on the owner's laptop for this step. Android 16+ is the chosen test-device range; this handoff does not change the source's existing `minSdk=28`, `targetSdk=35`, or `compileSdk=36` and does not establish compatibility before device testing.

## First sign-in and smoke checks

1. The owner taps **Sign in** and completes the Cognito email/password flow in the browser. The owner enters the password personally; the builder does not need it. The Victor Cognito user now reports `CONFIRMED` after its first-password flow, so use its permanent app password. The AWS IAM Identity Center `victor-admin` password and AWS access portal sign-in are separate from Victor's Cognito sign-in.
2. Confirm Personal and English Practice both send and display text replies. A Practice message must not create a Personal memory fact.
3. In Personal, send a harmless explicit preference such as “I enjoy hiking.” Confirm the fact appears under **Memory**, can be corrected, and can be deleted.
4. Sign out or close/relaunch the app and confirm unauthenticated requests are rejected. This first app keeps tokens in memory only, so relaunch requires sign-in.
5. Never use real passwords or account numbers for Phase 1 testing. Secret saving and passkey retrieval are not implemented; automatic detection can miss values.

Also verify history, mode switching, and that Practice cannot recall a harmless Personal-only preference. Report build/install success and each device result before marking TASK-001 through TASK-004 complete. The browser's newer Pending/All/Confirm controls are a separate acceptance check (TASK-012); do not assume Android has those controls.

The deployed API rejected unauthenticated GET and POST requests with HTTP 401. Direct synthetic Lambda invocations passed for both modes, but Android sign-in and end-to-end API behavior remain untested until this device check.
