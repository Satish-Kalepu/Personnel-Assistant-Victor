# Current Android configuration variables ? 2026-11-23

## Prompt

give me variables that needs to be set for android device like API_URL
cognito was replaced. anything else should I know&#x20;

## Questions and decisions

- List actual current APK settings and authentication/voice behavior; distinguish public build config, runtime user credentials and backend-only secrets.
- No Android build/config repair inferred. Preserve previously diagnosed native mute mismatch as pending repair.

## Actions

- Inspect properties template/build config, account/session code, voice gateway configuration and manifest.

## Files changed

- This prompt, notes/ideas.md and dairy.md only; no app/private settings or credentials changed.

## Verification

- Source inspection confirms only BuildConfig.API_URL from android/victor.properties; no current Cognito variables. Verified native backend auth headers/Keystore storage and dynamic voice-config gateway fetch; manifest mic/internet permissions and release HTTPS guard. No APK compilation or device tests.

## Outcome

- Provided exact staging API_URL, config location and what is no longer required; separated backend secrets/runtime sign-in/build tools and called out pending native voice parity/known mute correction.
