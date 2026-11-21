# Voice demo provider setup - 2026-11-21

## Prompt

also ask me if you need any additional subscriptions, gemini key, openai key etc., to continue this.

## Questions and decisions

- Owner explicitly invites requests for missing provider access/subscriptions during the ongoing plan/demo testing work.
- Existing OpenAI key has supported initial Live checks; do not request another unnecessarily or copy credentials into chat/records.
- Need to verify Gemini/LiveKit access, current plan prerequisites and compatible voice-worker runtime before a full secondary live test. Request private local configuration and a readiness confirmation, not secret values in chat.

## Actions

- Verified official LiveKit pricing/Gemini integration/quickstart and Google API-key setup. LiveKit Inference can supply Gemini 3.8 Live without a separate Google key; current Build plan is listed at $0/month/no card, subject to account credits/quotas.
- Requested private root .env setup and readiness, offering LiveKit+Google key, LiveKit-only inference, or Google-key-first testing. Never requested secret values in chat.
- Wrote source-linked setup/access requirements and a tracked empty variable-name example. Actual local Node is v26.13.0; full worker/native dependency compatibility still needs a spike.

## Files changed

- This prompt; research/voice-chatbot-2026-11-21/10-provider-access-and-next-tests.md; demo/provider.env.example; research index and shared idea/diary records.

## Verification

- Existing primary access verified only to initial protocol/WebRTC scope; secondary access not verified. Documentation links and empty configuration example checked; no real values written. No account/purchase/deployment operation.

## Outcome

- Required setup options provided; owner selection/readiness remains pending. No extra OpenAI key or paid monthly subscription requested at this stage. Continue full secondary live testing once selected access is configured.
