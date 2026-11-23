# Android next step ? 2026-11-23

## Prompt

what next.  should we build android ?

## Questions and decisions

- Assess existing Android implementation and recommend next scope. This is a planning question; do not infer approval of a new Android architecture or discovered-defect repairs.
- Carry forward Pixel8a/Android16+ and existing authenticated backend/provider choices. New web press/live controls are already deployed; native parity and actual physical audio acceptance are separate.
- Adopt supplied replacement AGENTS.md, including all-current-work staging workflow and separate repair consent; compare checked-in instructions as needed.

## Actions

- Inspect Android code/build readiness and current acceptance tasks before recommending the next step.

## Files changed

- This prompt, notes/ideas.md and dairy.md only. No application/build/configuration changes.

## Verification

- Inspected native activity/account/session/audio sources, build settings and handoff. Kotlin app exists; no wrapper/debug APK, no Java/Gradle/adb/sdkmanager on PATH or default SDK. Confirmed documented mute-field mismatch; no repair. Primary Android AudioRecord/latency guidance checked. No APK compilation or physical-device testing performed.

## Outcome

- Recommended Android as next milestone: baseline staging-connected debug APK using existing Kotlin/backend, then web voice-control/theme parity and real Pixel acceptance. Scope remains Discussing until owner selects/approves implementation; no repair permission inferred.
