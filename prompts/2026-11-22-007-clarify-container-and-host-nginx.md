# Clarify container and host Nginx — 2026-11-22

## Prompt

are we using nginx as part of our image/containers. ?&#x20;
or are you asking about stage server nginx service ?

## Questions and decisions

- User requests clarification about container Nginx versus the existing host service and the pending asset-ownership repair.
- Clarification only; no repair approval inferred and no runtime/host change authorized by this question.

## Actions

- Inspect web Dockerfile/container config, Compose bindings and existing host proxy fragment.

## Files changed

- This prompt and brief diary clarification only. No code/config/deployment changes.

## Verification

- Confirmed web/Dockerfile uses nginxinc/nginx-unprivileged and container config listens8080; Compose maps staging loopback18080 to it. Existing host HTTPS location fragment proxies the domain to127.0.0.1:18080. No runtime tests or privileged operations performed.

## Outcome

- Two layers confirmed: host Nginx handles HTTPS/domain routing; web-container Nginx serves static frontend and proxies API/WSS. Pending public-asset ownership repair concerns only the container image. No host Nginx edit/reload or sudo needed; no repair approval inferred from clarification.
