# Check single-agent queued input and tool loop — 2026-11-22

## Prompt

check this:&#x20;
when user given a statement or  fact &#x20;
you invoked llm agent for processing and the agent is calling tools&#x20;
meanwhile you got another fact. then you should not call another duplicate llm agent&#x20;
you should insert the latest statement in the llms next loop. along with tool result, you may have to provide other statements too, then agent should intelligently plans the execution steps. &#x20;
or the new statements should be queued and sent to processing and agent should give summary of both statements.&#x20;

is it also considered already ?

## Questions and decisions

- User asks whether one active logical agent consumes new statements with tool results at its next loop, or queues them and produces a combined response.
- Audit current implementation, distinguish implemented serial batching/context from a future tool-aware agent inbox. Discussion does not authorize implementation/deployment; new IDEA-018 remains Discussing.

## Actions

- Read agreement, VoiceSession queue/processing/reply guards, assistant conversation lock/history, single model-call implementation and earlier architecture plans. Verified current model has no tool definitions/execution loop.
- Recorded current versus proposed behavior in research15 and new IDEA-018 Discussing. Explicitly distinguish queued sequential model calls from competing agent runs and a future tool-aware inbox; combined-summary coverage is not guaranteed today.

## Files changed

- This prompt, research15/index, IDEA-018 in notes/ideas.md, DEBT-012 audit gap and dairy.md. No runtime source/config/data/deployment changes; ignored local dist rebuilt for verification only.

## Verification

- Current source inspected; fresh TypeScript build and all six focused retention/serialization tests passed. First local test invocation used older compiled output and failed the latest reply guard assertion; rebuilding current source resolved the artifact mismatch without a source repair. No provider request, production data access or staging mutation.

## Outcome

- Partially implemented: one active voice batch, pending queue/grouping and prior saved context. Not implemented: active agent tool-result/new-input loop and explicit combined-summary guarantee. IDEA-018 remains Discussing; no new implementation task finalized or deployment performed.
