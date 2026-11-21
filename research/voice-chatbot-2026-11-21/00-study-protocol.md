# Realtime mobile voice assistant: study protocol

Research date: 2026-11-21, Asia/Calcutta. Status: desk research and experiment design complete; physical-device experiments not run.

## Research question

Which architecture and product combination makes an individual Android/web voice conversation feel immediate, natural, and locally responsive?

The owner explicitly prioritizes fastest natural conversation and the best experience without a monthly-budget cutoff (prompts 011 and 012). Cost is a separate observation, never an eligibility gate in this study. Existing runtime spending controls are not changed by research.

## Context and scope

- Pixel 8a/Android 16+ and web are the established clients; English-first is already agreed. Indian English and optional later code-switching deserve explicit tests.
- Existing approved implementation uses OpenAI reasoning, Sarvam speech, TypeScript/Node, MongoDB, Redis and Docker on EC2. Cloud processing outside Mumbai is already allowed.
- Research considers Google, AWS, OpenAI, Microsoft Azure, specialist speech/voice platforms, orchestration frameworks, and on-device/open-model alternatives. It is a representative ecosystem survey, not a claim to have audited every vendor or SKU.
- Deliver recommendations and a reproducible experiment protocol under this folder. No runtime repair, provider migration, purchases, account mutations, or personal-audio uploads are included.

## Staged agentic method

Use explicit research roles sequentially within one agent: investigator, source verifier, architecture designer, skeptical reviewer, experimental designer, and synthesizer. Each stage produces a document and an uncertainty list. This is a documented agent workflow, not a claim that independent researchers or parallel agents validated the result.

| Stage | Question | Output | Completion rule |
|---|---|---|---|
| 0: protocol | What is being optimized? | This document | Explicit objectives, hypotheses, boundaries |
| 1: baseline and physics | Where does waiting come from? | 01-latency-and-current-baseline.md | Metrics and current-code observations separated from measurements |
| 2: evidence | What do current providers actually offer? | 02-platform-evidence.md; sources.md | Primary links, current versions, uncertainty labels |
| 3: design and challenge | Which combinations are plausible winners? | 03-architecture-and-best-practices.md; 04-decision-and-challenges.md | Conditional recommendation, alternatives, failure cases |
| 4: experiment | How would we falsify the recommendation? | 05-benchmark-protocol.md; templates | Reproducible device/audio/network/quality protocol; no fabricated results |
| 5: synthesis | What should the owner choose to test next? | README.md; 06-cost-and-operating-notes.md | Concise recommendation, source trail, open gates |

## Hypotheses to test

- H1: Native audio or full-duplex voice with asynchronous reasoning will feel faster than the current whole-reply pipeline, without unacceptable loss of correctness.
- H2: Turn detection, audio capture/playout and interruption handling affect perceived speed at least as much as nominal STT/TTS first-byte numbers.
- H3: A voice model can keep a conversation fluid while a separate backend performs slow work; this does not make the factual task result arrive sooner by itself.
- H4: Direct client media can reduce relay overhead, but an India-region relay or specialist WebRTC stack may outperform it on some networks. Measure rather than assume.
- H5: An optimized streaming STT -> LLM -> TTS pipeline can remain competitive where exact spoken text, voice selection, transcript inspection, or language specialization is essential.
- H6: Local audio controls and local commands improve immediacy; fully local general intelligence is not automatically faster or more capable on Pixel 8a.

## Evidence rules

Label observations as DOCUMENTED capability, VENDOR CLAIM, LOCAL CODE observation, HISTORICAL MEASUREMENT, DESIGN INFERENCE, or PROPOSED TARGET. Do not turn vendor latency, token speed, server first byte, or prior synthetic tests into measured phone performance. Record retrieval date; exact model lifecycle, account access, regional behavior, pricing and privacy settings need rechecking before implementation.

Use official documentation, official repositories and research papers. Do not copy entire pages. Preserve original decisions; new architecture remains Discussing until explicit owner selection. Benchmark outcomes stay empty until actual experiments occur.
