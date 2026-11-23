# Explain laptop development with staging host Nginx — 2026-11-22

## Prompt

okay. then remote has nginx service so it works. how local run in the laptop would work?&#x20;

## Questions and decisions

- Explain local development versus proposed staging host-only serving, based on actual repository scripts/configuration.
- Do not infer approval to implement local proxy or activate host migration from this question.

## Actions

- Inspect frontend dev scripts, Compose networking and current local instructions for the correct local routing recommendation.

## Files changed

- Updated this prompt, notes/ideas.md, docs/host-nginx-migration.md and dairy.md; no runtime/deployment change.

## Verification

- Inspected actual dev script, Compose and voice same-origin validation. Confirmed no Vite proxy config/API port mapping yet. Checked primary Vite proxy/WebSocket and MDN microphone localhost documentation. No runtime tests, starts or deployments performed.

## Outcome

- Explained proposed Vite+Docker laptop mode versus host-Nginx+Docker staging. Current local Nginx mode remains unchanged; Vite proxy/origin/API port wiring is a future implementation step, not claimed working today. Prompt/idea/runbook/diary changes only.
