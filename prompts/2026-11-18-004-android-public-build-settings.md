# Android public build settings - 2026-11-18

## Prompt
give me API_URL and COGNITO_DOMAIN and CLIENT_ID
to configure in the build

## Questions and decisions
- Provide only the three requested public app settings from the existing local configuration.

## Actions
- Read matching properties from android/victor.properties without displaying unrelated configuration.

## Files changed
- This prompt entry and dairy.md; no application or AWS changes.

## Verification
- Checked the three requested keys exist exactly once and are nonempty. No live AWS or build verification performed.

## Outcome
- Return copyable properties for android/victor.properties. Compilation and device checks remain pending.