# 2026-11-09 — Bootstrap project guidelines

## Prompt

> okay give me a bootstrap readme.md, agents.md and claude.md files to quick start any project which follows these rules.
>
> 1. when I disucss ideas it has to maintain a note on ideas
> 2. when I finalize ideas it has to update todolist and pending techdebt notes accordingly
> 3. it should never do auto repair anything without informing me what was wrong and without taking my concent for the next step
> 4. it should always keep asking lot of questions to get clarity and keep me in the loop of decision making process
> 5. each prompt should be stored in a prompts folder, so we know what has been asked everytime and what agent has done . it is an overview of changes maintained in a folder.
> 6. it should also maintain a dairy.md file which keeps notes of day to day developments

## Questions and decisions

- No clarification was needed to make a stack-neutral starter.
- Used standard uppercase filenames `README.md`, `AGENTS.md`, and `CLAUDE.md` so common tools can discover them.
- Placed notes under `notes/` and prompt history under `prompts/`.

## Actions

- Inspected the workspace; it contained no project files and was not a Git repository.
- Created operating instructions, note templates, and this first prompt record.

## Files changed

- `README.md`, `AGENTS.md`, `CLAUDE.md`: starter guide and agent rules.
- `notes/ideas.md`, `notes/todo.md`, `notes/tech-debt.md`, `dairy.md`: ongoing records.
- `prompts/README.md`, this file: prompt log instructions and first entry.

## Verification

- Checked that all starter files exist and the referenced paths are consistent.

## Outcome

- Bootstrap starter created. Project-specific details remain to be filled in.
