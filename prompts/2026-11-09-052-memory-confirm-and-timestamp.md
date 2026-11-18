# 2026-11-09 — Memory confirmation and timestamp

## Prompt

> one issue, when i click confirm in memory item, it is still showin in queue .
> also show a timestamp when the memory item was added so it would be easy to understand for the user.

## Questions and decisions

- The owner reports a Memory item remains visible after clicking “confirm” and requests its added timestamp in the UI.
- The current browser source has a native confirmation dialog for Delete, a Correct button, and a Save correction button; there is no distinct Confirm action. Clarification is needed to identify the exact interaction.
- Fact records already have a `createdAt` UTC timestamp; the browser Memory list does not display it.
- AWS documents that DynamoDB table queries are eventually consistent by default and may return old data immediately after a successful write. The current `DynamoRepo.facts` query does not request strong consistency. This is a plausible cause of the stale Memory list, pending the owner's clarification.
- The owner clarified that “confirm” meant Correct → Save correction, and chose browser-local time with a zone label. The main cause is that correction sets `corrected=true` but the current UI renders all facts in a single list; eventual consistency is a secondary risk for seeing old wording immediately after the update.

## Actions

- Inspected browser and backend Memory flows; asked which “confirm” action the owner used and whether timestamps should be browser-local or fixed IST.
- Added local browser rendering of each fact's original `createdAt` in browser-local time with its zone label, newest first. No backend or AWS change yet.

## Files changed

- This prompt record, `backend/web/app.js`, `backend/web/styles.css`, `notes/ideas.md`, and `notes/todo.md`.

## Verification

- `node --check backend/web/app.js` passed. A sample UTC timestamp formatted as `9 Nov 2026, 6:04 pm IST` with the intended `Intl` options. The timestamp feature was subsequently included in the approved local review-flow source update recorded in prompt 053; nothing from this prompt alone was deployed.

## Outcome

- Clarification resolved. The owner chose Pending review and All memory plus Confirm in prompt 053; that prompt tracks the combined source change and pending AWS review.
