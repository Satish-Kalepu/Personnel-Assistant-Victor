# Stage deployment record

Owner supplied `ai_assistant@65.2.130.74` on 2026-11-21 (prompt 001, IDEA-015/TASK-017). AWS confirms Mumbai EC2 `i-05e7240ff938a2e49`, running `t3.medium`. This explicitly selects reuse of the formerly unapproved existing host, subject to a workload/capacity review. It does not authorize disruption of unrelated services.

## Current access and routing

AWS SSO renewed successfully. SSH responds, but the host key is new to the laptop. Candidate ED25519 fingerprint: `SHA256:tWVvg6Px5vqbad8K7x5AGU+0SjYXFipeZ5b7w6O0VbY`. The latest AWS console log contains no usable fingerprint and SSM is offline. A first local comparison was invalid because of a PowerShell automatic-variable collision; it was corrected and the invalid trust file removed. The correct comparison found no prior matching key. Strict SSH checking prevented login in both attempts. Await owner confirmation of the candidate or a different trusted fingerprint; do not infer acceptance from elapsed time.

No stage login, upload, installation, service startup or host modification has occurred. Existing SSH key material has not been printed/copied into the application. Root provider keys remain private.

Owner will provide HTTPS domain and ALB details (prompt 002). No ALB exists in the connected Mumbai account at inventory time. Do not create DNS/certificates/listeners/target groups or a paid ALB without the concrete routing choice. Existing EC2 ingress includes broadly public web/SSH/FTP/panel ranges; leave unrelated rules/services unchanged pending ownership review.

## Prepared deployment artifacts

API/web images are built with a release label plus source hash, recorded privately in `deploy/.local/stage-images.json`. `API_IMAGE` and `WEB_IMAGE` allow a versioned deployment/rollback; build contexts exclude environment files. Private `.env.stage` was generated with independent DB/auth/mail/backup secrets and only the two required provider keys copied from root `.env`; it is ignored and values were not displayed. Nothing has been transmitted to the host.

`compose.stage.yml` is an optional provisional private configuration: separate `victor-stage` project, web on loopback 18080, Mailpit viewer on loopback 18025, MongoDB/Redis unpublished. It is not a public production release. `compose.prod.yml` requires the HTTPS/domain and real SMTP settings. Validate either mode with `docker compose ... config --quiet`; never print expanded config/secrets.

After trust/access: inspect OS/architecture/free disk/RAM, Docker/Compose versions and permissions, existing containers/listening services, deployment path ownership and available ports. Use only a dedicated application directory/project. Preserve previous image tags for rollback; transfer provider settings only through verified SSH and restrictive server permissions. Never upload local development database volumes or old personal data.

Before public release: verified HTTPS/ALB routing, SES production delivery/suppression, narrow app ingress, protected off-host backups/retention and recovery targets, versioned deployment checks, and actual browser/Pixel acceptance. The friend still needs to compile the Android update.
