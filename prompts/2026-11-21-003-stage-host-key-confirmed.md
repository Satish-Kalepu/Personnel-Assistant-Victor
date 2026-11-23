# Stage host key confirmed - 2026-11-21

## Prompt
Reply to: SSH needs a trusted host-key check before the first login. Please verify in your EC2 console/trusted terminal that the server’s ED25519 fingerprint is `SHA256:tWVvg6Px5vqbad8K7x5AGU+0SjYXFipeZ5b7w6O0VbY` (run `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` on the server), then confirm it here. The old EC2 console log has no fingerprint, and SSM is offline.
Answer: I verified that fingerprint; trust it

## Questions and decisions
- Owner explicitly verifies and authorizes trust of the exact stated ED25519 fingerprint for ai_assistant@65.2.130.74.
- Recheck the presented key matches, then authenticate using strict checking and existing local SSH credentials. No further host-key approval is needed unless the key changes.
- Domain/ALB details are still forthcoming; public routing remains unconfigured.

## Actions
- Fresh key matched the exact owner-confirmed fingerprint. Pinned it in an ignored project trust file; strict SSH login succeeded. Inspected capacity/workloads before creating the dedicated app project.

## Files changed
- This prompt entry, ignored public host trust file, stage/idea/task/diary records. Runtime deployment is recorded in prompt 001.

## Verification
- Fingerprint, public-key authentication, host capacity and Docker access verified; no private key contents displayed or copied.

## Outcome
- Host-key trust blocker resolved by owner confirmation; stage work continues.
