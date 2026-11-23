# Repo friend build message - 2026-11-18

## Prompt
why do you make a zip file. i will share this repo with them. just tell me what to ask exactly.

## Questions and decisions
- Owner explicitly prefers sharing the repository with the friend; ZIP packaging was unnecessary.
- Provide a copyable build request. Preserve the earlier device/build decision and record the changed handoff method in IDEA-012.

## Actions
- Prepared a message requesting an Android debug APK for Pixel 8a on Android 16+, using the existing pinned build toolchain.
- Include the ignored android/victor.properties prerequisite: it must be shared separately and contains three public app settings; AWS credentials and Victor password are not needed.
- No additional packaging, SDK installation, application changes, or external messages.

## Files changed
- This prompt entry, notes/ideas.md decision update, and dairy.md.
- Existing ZIP preserved; no deletion requested.

## Verification
- No new runtime checks or tests performed; reused the inspected Gradle scripts and previously verified toolchain requirements.
- Build and phone testing remain pending.

## Outcome
- Provide the exact friend-build message; use repository sharing instead of ZIP handoff.