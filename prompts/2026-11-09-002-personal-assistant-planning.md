# 2026-11-09 — Personal assistant planning

## Prompt

> We are going to build a personnel assistant for myself.
>
> I want it to be like an app which runs in cloud in my aws account ( by using various serverless aws services ), and an android app, where I can speak to it and chat with it.
>
> features:
>
> 1. Every conversation I make, every detail I give should be maintained as a knowledge graph in the backend
> 2. Should auto care for confidential information, when i seek confidential info, it should ask for extra password
> 3. I will also use this app as my friend to practice english, so it has to intelligently separate english practice conversation separately and should not mix with my personnel knowledge graph
> 4. The android app should also have a feature to silently listen every conversation and keep uploading to my personnel cloud and then analyze it for me to understand later. only when i enable auto record button.
> 5. The andorid app should also auto start when i say "Hi Victor" or some wake phrase
> 6. I also want you to research how to use existing google assistant or some android native feature to use
> 7. We also need to make sure device battery is maintained optimal. let me know all issues beforehand.
> 8. It should use my personnel aws account as a backend.
> 9. I will also link my personnel gmail and my company gmail which it has to keep reading new emails and store the overview/summary in the backend for me to answer questions
>
> Lets start planning first. tell me issues/blockers

## Questions and decisions

- No implementation decision has been finalized. Asked about recording scope, company Gmail permission, and Android installation/device; responses are pending.
- Additional open questions are listed in `notes/planning.md`.

## Actions

- Read the repository working agreement and existing notes.
- Reviewed official Android, Google, and AWS documentation on microphone services, voice launch, battery management, Gmail access/push, serverless backends, graph modeling, and step-up authentication.
- Created seven discussion entries in `notes/ideas.md` and a sourced architecture/risks proposal in `notes/planning.md`.

## Files changed

- This prompt record.
- `notes/ideas.md`, `notes/planning.md`, and `dairy.md` record the planning discussion and findings.
- `notes/todo.md` and `notes/tech-debt.md` were not changed because nothing was finalized.

## Verification

- Confirmed the planning and log files exist and checked official source documentation. No code tests apply to this planning-only request.

## Outcome

- Planning proposal prepared with explicit blockers and user decisions. No application code or infrastructure was changed.
