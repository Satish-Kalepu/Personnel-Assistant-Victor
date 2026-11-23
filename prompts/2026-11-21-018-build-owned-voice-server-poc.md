# Build owned voice server POC - 2026-11-21

## Prompt

great lets build a poc first

## Questions and decisions

- Explicitly authorizes a first isolated POC of IDEA-017: our server receives continuous audio, identifies speech boundaries and coordinates an agent.
- POC scope: local WebRTC input, server-side pretrained VAD, visible boundary events and agent integration using existing privately configured providers where available. No production migration or new subscription required by default.
- Keep speech activity, silence-based endpointing and semantic thought completion distinct. Do not claim a device latency/quality winner from synthetic checks.

## Actions

- Read agreement, existing research/demo context and Sites local-only workflow. Selected isolated Python aiortc + local CPU Silero ONNX; production TypeScript backend unchanged.
- Installed pinned binary packages in ignored local venv and downloaded official pinned Silero model, recording checksum/commit. Sandbox blocked ensurepip/outbound download; narrowly escalated setup succeeded without changing global Python configuration.
- Built real WebRTC server, backend VAD/silence endpoint, event data channel, bounded in-memory session and generation cancellation, local acknowledgement agent, streaming Sarvam STT/OpenAI response/Sarvam TTS adapters and responsive browser screen.
- Used existing keys privately; cloud privacy flag is absent in saved configuration, so enabled it only in the synthetic test server process. No new subscription/account/configuration write.
- Real Python WebRTC local and cloud checks passed; measured cloud endpoint-to-first-server-PCM 3941 ms with correct complete arithmetic response. Latency remains well above the intended conversational experience.
- Browser found cosmetic errors; explained and received scoped repair approval in prompt 019, then corrected and verified zero console errors. Found synthetic browser clip lacks trailing silence (114 received VAD frames do not advance after clip end); asked explicit correction consent and have not applied it while pending. Initial failed evidence preserved.

## Files changed

- This prompt; owned-server-poc source/UI, pinned requirements/model manifest, synthetic evidence and setup README; experiment report 12 and research index; IDEA-017 / TASK-018 / DEBT-012 and diary. Prompt 019 records separate cosmetic consent and successful verification.

## Verification

- Seven core checks passed, including real ONNX silence, endpoint behavior, playback clear, cancellation and stale-transcript suppression. Python local/cloud WebRTC returned non-silent decoded audio; cloud transcript complete and answer 156 verified.
- Browser WebRTC/data channel/VAD start passed; synthetic replay turn-end blocked by missing trailing silence. End session cleared media; simulated microphone denial restored controls; missing-origin POST rejected403. JS/Python syntax and JSON parsing passed. Two real key values absent from scanned POC artifacts.
- No human microphone, physical Pixel/acoustic timing or production acceptance claimed. Production source/data/deployment unchanged by this work.

## Outcome

- Core POC and cloud chain demonstrated. Browser fixture correction awaits explicit owner consent; final replay/Stop reply remain open. Desktop/mobile screenshots captured and visually reviewed without horizontal overflow. Launcher and instructions saved. TASK-018 remains In progress; production architecture/provider selection remains Discussing. Owned preview server stopped after QA; restart via run.ps1 when ready.
- Follow-up in prompts020–021: correction explicitly approved and verified for turn/Stop/End; TASK-018 now complete for POC scope. Owned detection integrated and verified in staging app under TASK-019; initial failure preserved and approved repairs checked. Physical/speed acceptance and production architecture selection remain open.
