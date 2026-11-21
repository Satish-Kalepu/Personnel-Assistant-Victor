# Own realtime voice server idea - 2026-11-21

## Prompt

Nice.  on other Idea. Can we build our own server to listen for live audio and we identify users speach start point and end point in our backend and then we connect to our agent ?&#x20;
is it called webrtc server or what ?

## Questions and decisions

- Discuss a separate option: an owned backend receives continuous live audio, detects speech/turn boundaries and coordinates the agent.
- Explain media transport versus VAD, semantic end-of-turn detection, STT and agent orchestration; do not infer provider replacement or implementation approval.
- Existing experience-first priority applies. Current demo/provider-access follow-up remains open separately.

## Actions

- Verified primary Silero, LiveKit self-hosting/turn-management and Pipecat Smart Turn documentation.
- Wrote a terminology/component/flow note explaining WebRTC transport versus a voice orchestration worker, VAD versus thought completion, concurrent STT and warmed agent connections, and self-hosting tradeoffs.
- Added separate IDEA-017 Discussing; preserved the existing two-plan/provider setup work.

## Files changed

- This prompt, research/voice-chatbot-2026-11-21/11-own-realtime-voice-server.md, research index, notes/ideas.md (IDEA-017), dairy.md.
- No application code, data, infrastructure, subscription or configuration changes.

## Verification

- Primary documentation checked; new local references and required prompt sections checked before finishing. No runtime tests or latency measurements were performed for this discussion.

## Outcome

- Concept explained and recorded. Whole system is a realtime voice agent server/gateway; WebRTC media transport is one component. Recommended self-hosted-media/owned-worker variant remains a proposal pending owner choice and measured comparison.
