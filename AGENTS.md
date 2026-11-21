# Agent working agreement

These rules apply to every agent working in this repository. Follow higher-priority instructions when they conflict, and tell the user about any rule you cannot follow.

## At the start of every user prompt

1. Create one file in `prompts/` named `YYYY-MM-DD-NNN-short-topic.md`, using the user's local date and the next available three-digit sequence for that date. Never overwrite a prior entry.
2. Record the user's prompt faithfully under **Prompt**. Redact credentials, access tokens, and other secrets; mark each redaction. Do not add private chain-of-thought.
3. Add **Questions and decisions**, **Actions**, **Files changed**, **Verification**, and **Outcome** sections. Fill them as work progresses. State explicitly when there were no changes or no verification.
4. If a prompt contains several requests, keep them in one entry and track each outcome.

## Ideas and decisions

- When the user discusses an idea, add or update an entry in `notes/ideas.md` with the date, summary, options, open questions, and status `Discussing`. Do this even if no code changes are made.
- Ask focused questions early and often enough to resolve goals, constraints, tradeoffs, and acceptance criteria. Present meaningful choices and recommendations, then let the user decide. Keep the user informed of findings and changes in direction. Do not repeatedly ask questions already answered.
- Only mark an idea `Finalized` when the user explicitly chooses or approves it. Record the decision, date, and rationale. Do not infer approval from silence.
- After finalization, update `notes/todo.md` with concrete tasks, priorities or dependencies where known, and completion criteria. Update `notes/tech-debt.md` with any known compromise or follow-up; if none is known, record that in the decision entry. Keep links or IDs between the three notes.
- If a decision changes, preserve the prior decision in the ideas note and update the related tasks and debt entries.

## Repairs require consent

- Never automatically repair a bug, failing test, broken configuration, data issue, or other defect. This includes a defect discovered while doing another task.
- First explain what is wrong, the evidence, the likely impact, the proposed repair, and any alternatives or risks. Ask for explicit consent for the proposed next step and wait for it before changing files or data to repair the defect.
- Investigation and read-only checks are allowed before consent. If a requested action is itself an explicit repair instruction with a clear scope, that instruction is consent for that scope; explain the diagnosis and intended change before applying it. Ask again if the necessary repair falls outside the approved scope.
- Record the finding, consent, repair, and verification in the prompt entry and diary. Never claim a repair succeeded without checking it.

## Daily record

- Add a dated entry to `dairy.md` for work on each day. Summarize discussions, decisions, changes, tests, blockers, and next steps. Link the relevant prompt entry and note IDs.
- Update the prompt entry and diary before finishing a response. If work continues across days, add a new diary entry for each day worked.
- Keep records factual and brief. Do not copy secrets or unnecessary personal data into notes.

## Staging deployment workflow

- Deploy application code through Git: commit/review locally, push the Stage branch without force, fast-forward pull the expected commit on staging, and build versioned images on the staging host.
- Do not upload workstation application archives/images, database contents or local env files as a substitute for Git deployment. Keep staging private configuration and persistent data on staging, outside Git; retain prior releases for rollback.
- When an authorized step actually requires elevated host privileges, explain the exact command, scope and reason, then request scoped sudo access. Do not work around a privileged operation by copying artifacts or changing unrelated permissions. Do not request sudo passwords in chat.
- User instructions override older artifact-transfer/bootstrap guidance. Existing transfer scripts are historical and must not be used for routine staging deployment.

## Working style

- Make consequential choices visible before acting. Ask clarifying questions when requirements or acceptance criteria are unclear, and keep the user involved throughout the work.
- Explain what changed, why, how it was checked, and what remains open.
- Do not mark tasks complete until their completion criteria are met.
