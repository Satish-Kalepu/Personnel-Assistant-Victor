# 2026-11-09 — Memory review decision

## Prompt

> Pending + All memory (Recommended)
>
> Yes, add Confirm (Recommended)

## Questions and decisions

- The owner chose a Pending review list plus an All memory view. Corrected and confirmed facts should leave Pending but remain available to Victor and visible in All memory.
- The owner chose a Confirm action for an unchanged pending fact.
- The owner previously chose browser-local added timestamps with a zone label in prompt 052.

## Actions

- Implemented the `reviewed` marker and `reviewedAt` in fact updates, with Confirm and corrected facts leaving Pending while staying in All memory and model context. Existing `corrected=true` facts count as reviewed.
- Added strongly consistent table reads for Memory refresh, browser-local `createdAt` display, review tabs, and Confirm button. Updated project idea/task/debt and deployment notes.
- Built the final package and prepared nonexecuted change set `samcli-deploy1794246063`; removed an earlier superseded nonexecuted draft. No live stack execution.

## Files changed

- This prompt record; `backend/app/core.py`, `backend/app/handler.py`, `backend/web/app.js`, `backend/web/index.html`, `backend/web/styles.css`, `backend/tests/test_core.py`, `backend/tests/test_web_memory.cjs`, `backend/README.md`, `docs/web-client.md`, `README.md`, `notes/ideas.md`, `notes/todo.md`, `notes/tech-debt.md`, `notes/deployment-review.md`, `aws-requirement.md`, and `dairy.md`.

## Verification

- Twelve backend tests, Node Memory rendering test, JavaScript syntax, Python compilation, SAM lint, and SAM build passed. Processed change set `samcli-deploy1794246063` is `CREATE_COMPLETE` / `AVAILABLE`, modifies Lambda/API in place, adds no IAM/resources, and preserves JWT on five data methods. Live stack remains unchanged at `UPDATE_COMPLETE`.

## Outcome

- Local implementation is ready for the owner's separate change-set execution decision under `aws-requirement.md`. Live Memory behavior and timestamps remain unverified until deployment and owner browser testing.
