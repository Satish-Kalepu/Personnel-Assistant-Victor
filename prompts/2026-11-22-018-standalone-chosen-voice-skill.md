# Standalone chosen voice architecture - 2026-11-22

## Prompt
make the file independent. no external links. because i am only copying one file. we do not need other research items. we already finalized architecture right. just make it little small by theme "it is the architecture to go ahead with"

## Questions and decisions
- Owner explicitly selects the current architecture as the approach to carry forward. Present the note as a concise implementation specification, not an architecture evaluation.
- Keep one self-contained file, removing documentation/source/research links and historical experiments. Retain enough settings, protocol, ordering and lifecycle rules to implement without the original repository.
- This authorizes documentation revision, not a new product implementation or runtime repairs/deployment.

## Actions
- Rewrote voice-chatbot-skill.md as the chosen current-architecture implementation specification. Removed all external/local links, source-map/research/history sections and repository-specific copy/deployment-script dependencies.
- Retained stack choices, audio formats, protocol, owned detection, input/output lifetimes, backend/persistence/speech/playback behavior, configuration/deployment and acceptance. Recorded owner finalization in IDEA-022; TASK-023 complete; existing debt remains.

## Files changed
- voice-chatbot-skill.md, this prompt entry, notes/ideas.md, notes/todo.md, notes/tech-debt.md and dairy.md. No application/config/runtime changes. Existing unrelated changes preserved.

## Verification
-1613 words versus2950:45% shorter. No external/repository links or source/research paths; code fences and bounded skill metadata checks passed.
-21 configured secret values checked with0 matches; values never displayed. Git whitespace check passed. No runtime tests, external calls, dependency install, deployment or application repair performed; full YAML validator not claimed.

## Outcome
- Complete: one concise independent file, framed as the architecture to implement. No other files are needed to understand/copy the guide.
