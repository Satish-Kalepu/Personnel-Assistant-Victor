# Stage host key confirmed - 2026-11-21

## Prompt
Reply to: SSH needs a trusted host-key check before the first login. Please verify in your EC2 console/trusted terminal that the server’s ED25519 fingerprint is `SHA256:tWVvg6Px5vqbad8K7x5AGU+0SjYXFipeZ5b7w6O0VbY` (run `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` on the server), then confirm it here. The old EC2 console log has no fingerprint, and SSM is offline.
Answer: I verified that fingerprint; trust it

## Questions and decisions
- Owner explicitly verifies and authorizes trust of the exact stated ED25519 fingerprint for ai_assistant@65.2.130.74.
- Recheck the presented key matches, then authenticate using strict checking and existing local SSH credentials. No further host-key approval is needed unless the key changes.
- Domain/ALB details are still forthcoming; public routing remains unconfigured.

## Actions
- Pin confirmed key and inspect host read-only before deployment changes.

## Files changed
- This prompt entry and ignored public host trust file; subsequent stage records pending.

## Verification
- Fresh fingerprint/access/capacity checks pending. No private key contents displayed.

## Outcome
- Host-key trust blocker resolved by owner confirmation; stage work continues.
