# Compact chat and full-screen live UI ? 2026-11-23

## Prompt

okay. lets change the frontend UI .&#x20;

move name , profile, signout buttons to  top right  mobile menu&#x20;
remove line  choose personel or english practice&#x20;
memory  button  move to  profile menu&#x20;
new chat delete chat buttons.  make very small .new chat is just "+" symbol.  delete chat to be showon only in separate conversations screen&#x20;
when I click live mode , just fill the live theme all over, no need to show other menus headers and footers.&#x20;
it would only show exist live button.&#x20;

"Hold to speak, then release for a reply. Choose Live mode to keep talking."&#x20;
remove such text , users can understand the flow by buttons.&#x20;
save space

## Questions and decisions

- Explicitly requested compact top-right account menu with name/profile/signout/Memory; small plus for new chat; deletion only in separate conversation management view.
- Live mode fills the viewport and hides normal chat/navigation/header/footer, exposing only its Exit live action plus a non-interactive live visual. Remove verbose voice/mode guidance from visible UI.
- Preserve current Personal/English Practice separation, existing voice backend/lifecycle and keyboard-accessible controls. Use standing all-changes Git staging workflow.

## Actions

- Inspect current frontend structure, app navigation and live-state handling before editing.

## Files changed

- web/index.html, web/app.js, web/styles.css; notes/ideas.md (IDEA-027), notes/todo.md (TASK-028), dairy.md and this prompt.

## Verification

- JS syntax and Vite production build passed; four existing voice-client regressions passed.
- Independent UI API fixture: Profile, Memory, new/open/delete conversations, practice separation, Escape, no JS errors; 320/390/1280 widths had no horizontal overflow. Reviewed mobile screenshot. Dedicated dev server started after initial connection unavailable.
- Staging and actual live audio acceptance pending.

## Outcome

- In progress.
