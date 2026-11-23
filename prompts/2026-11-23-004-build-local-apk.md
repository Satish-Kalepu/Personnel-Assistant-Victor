# Local Android APK build - 2026-11-23

## Prompt

okay. build apk locally.

## Questions and decisions

- Build a staging debug APK locally using command-line tools only; no Android Studio.

## Actions

- Inspected tools/source; ran isolated local Docker assembleDebug against a temporary staging-configured source copy.
- First Docker assembleDebug attempt failed at :app:checkDebugAarMetadata: OkHttp Android5.5.1 requires minCompileSdk37; project compileSdk36/AGP8.13.2 supports36. No APK produced and no source dependency changed. Read-only Maven AAR checks:5.4.0 minCompileSdk36;5.3.2 minCompileSdk1. Proposed one-line5.4.0 pin versus broader toolchain upgrade; explicit repair consent requested under AGENTS.md, pending.
- Toolchain ready: reused image sha256:9a5841dc9e23d199712d8fa46b11490399130db5d77f5252c70c6e9e25a9e740 (Java17.0.13), Gradle8.13 archive SHA25620f1b1176237254a6fc204d8434196fa11a4cfb387567519c61556e8710aed7860 verified; SDK36 and tools35.0.0. Separate victor-android-sdk/victor-android-build-cache volumes; disposable container removed on failure. Android Studio not installed, other workloads unchanged.


## Files changed

- This prompt record; build outputs will stay ignored.

## Verification

- Toolchain/Gradle checksum verified; build failed on confirmed dependency metadata mismatch. APK/signature/device checks could not run.

## Outcome

- Awaiting explicit dependency-repair choice; no APK yet.
