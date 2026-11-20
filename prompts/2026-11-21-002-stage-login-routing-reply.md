# Stage sign-in and routing reply - 2026-11-21

## Prompt
Reply to: The normal AWS sign-in page is open for the expired session. Please complete sign-in locally and tell me when done so I can verify the stage server’s identity. No AWS resources have been changed.
Answer: go ahead

Reply to: Do you already have a stage HTTPS domain and ALB to use? Until those and production email settings are ready, I recommend keeping stage private through an SSH tunnel.
Answer: I will provide the HTTPS domain and ALB details

## Questions and decisions
- Continue authorized stage work. Check actual SSO completion; do not infer successful authentication solely from the words go ahead.
- Domain/ALB details will be supplied by owner; do not invent DNS/certificate/listener settings or expose a development service publicly while waiting.

## Actions
- Resume access verification and independent local restore/deployment preparation.

## Files changed
- This prompt entry; related records will be updated as work progresses.

## Verification
- SSO and host verification pending. No server mutation yet.

## Outcome
- In progress.
