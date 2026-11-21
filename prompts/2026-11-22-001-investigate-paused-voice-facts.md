# Investigate facts lost across voice pauses — 2026-11-22

## Prompt

great job. it is very smooth.   But on small glitch , if I am feeding multiple facts with little gap.  it is missing out previous statements.  only taking last statement and processing it.

## Questions and decisions

- User reports that several spoken facts separated by short pauses result in only the last statement being processed.
- Investigate with synthetic statements and read-only source checks. No authorization inferred to repair a newly diagnosed defect; explain evidence and proposed scope and request explicit consent per AGENTS.md before repair.

## Actions

- Read repository agreement and current owned-STT adapter, voice session and backend speech worker. Investigating transcript suppression and response cancellation across pauses.

## Files changed

- This prompt entry. Investigation/idea/diary records will be maintained; no runtime repair or deployment yet.

## Verification

- Reproduced with three synthetic statements. Adapter forwarded only the last delayed final; session canceled processing of the first two and simulated only the last commit. No providers/production DB used. Raw diagnostic abort flags were recorded after session cleanup (which also aborts the completed last request); pre-cleanup assertions verified only the first two were interrupted during processing.

## Outcome

- Two input-loss paths diagnosed; explained and requested explicit scoped repair consent. Owner approved in prompt002; repair continues there. No runtime change or deployment in the investigation itself.
