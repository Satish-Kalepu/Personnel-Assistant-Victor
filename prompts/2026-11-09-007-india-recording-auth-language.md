# 2026-11-09 — India recording, authentication, launch, and language

## Prompt

> In which country or countries will Auto Record be used, and how will you inform people in meetings or conversations that recording is active?
>
> India only.
> I wont inform anybody. I am recording it on my personnel phone for myself to see summary notes to get more clarity or use for my personnel assistant app to help me if i failed to focus in meeting.
>
> For confidential answers, what second check do you want after normal sign-in?
>
> Passkey or biometric plus server check (Recommended)
>
> For the first Android version, is “Hey Google, open Victor” acceptable while we test whether “Hi Victor” works on your eventual phone?
>
> Yes, start with Google Assistant (Recommended)
>
> Which languages should Victor and Auto Record transcribe first?
>
> English only

## Questions and decisions

- Auto Record would be used in India. User does not plan to inform other people and wants private meeting summaries and assistance when attention lapses.
- Confidential answers should require a passkey or device biometric plus a server-side freshness/authorization check.
- First version may use Google Assistant to launch Victor; custom “Hi Victor” remains a later device-specific feasibility test.
- English is the first supported transcription language.
- Legal and workplace-policy implications of unannounced recording and cloud processing require source review. No legal conclusion has been reached.

## Actions

- Reviewed the Indian Supreme Court's 2025 recording-admissibility judgment, the DPDP Act and commencement notification, Android microphone requirements, and official passkey/Cognito documentation.
- Updated IDEA-001, IDEA-003, IDEA-004, IDEA-005, IDEA-006, and `notes/planning.md` with language, launch, authentication, and recording-permission findings.
- Asked whether company meeting recording/upload is permitted and how confidential data should be classified and spoken.

## Files changed

- This prompt record, `notes/ideas.md`, `notes/planning.md`, and `dairy.md`.

## Verification

- Checked current primary sources and verified the choices in the planning notes. No code tests apply.

## Outcome

- Choices recorded. Unannounced recording in personal and workplace settings remains a legal/policy issue requiring specific review; the cited judgment does not create blanket permission. No app code or AWS resources changed.
