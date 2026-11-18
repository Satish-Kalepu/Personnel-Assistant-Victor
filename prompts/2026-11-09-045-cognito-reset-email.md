# 2026-11-09 — Cognito reset email

## Prompt

> https://victor-private-78d0389e91.auth.ap-south-1.amazoncognito.com/confirmForgotPassword?client_id=2eg6jt54fmtbcd2n0pt55nkg3o&response_type=code&redirect_uri=victor%3A%2F%2Foauth2redirect&scope=openid+email
>
> this page not sending email . verify code not reaching my email though it is correct.

## Questions and decisions

- The owner reports no verification email from Victor Cognito's password-reset flow. No account change is authorized by this report.

## Actions

- Inspected the deployed Cognito user pool and user state using read-only AWS CLI calls.
- Checked AWS Cognito documentation for first sign-in, forgot-password code delivery, and the confirmation page.
- Clarified the first-sign-in path in the Android build handoff.

## Files changed

- This prompt record and `docs/android-build-handoff.md`.

## Verification

- The single Cognito user is enabled, email verified, and still `FORCE_CHANGE_PASSWORD`. Recovery includes verified email; the pool uses Cognito's default email sender. Temporary passwords are valid for seven days. No email address or password was printed.
- AWS's troubleshooting guide specifically lists `FORCE_CHANGE_PASSWORD` as a status to check when a forgot-password code does not arrive. AWS's endpoint guide says `/confirmForgotPassword` accepts a code after `/forgotPassword` initiates the reset; it is not a send-code page.
- No AWS mutation was attempted.

## Outcome

- The user should sign in with the temporary password from the Victor Cognito invitation and complete the new-password challenge. If that password is unavailable or expired, resending or resetting the Cognito invitation requires the owner's explicit consent. Actual email delivery was not independently observed.
