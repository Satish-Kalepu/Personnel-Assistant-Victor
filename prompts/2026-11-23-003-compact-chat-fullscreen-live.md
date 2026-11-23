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

- Implemented compact account menu, chat actions, separate conversation management and full-screen live overlay; normal shell inert with keyboard containment, Escape and Exit cleanup. Existing voice transport/backend unchanged.
- Secret-scanned all current changes, committed/pushed/pulled 0ec2cc7, server-built and activated stage-git-0ec2cc7607ac-20261123101212.
- Tested actual staged app using isolated synthetic account/audio; signed out and verified exact account/data cleanup.

## Files changed

- web/index.html, web/app.js, web/styles.css; notes/ideas.md (IDEA-027), notes/todo.md (TASK-028), dairy.md and this prompt.

## Verification

- JS syntax and Vite production build passed; four existing voice-client regressions passed.
- Independent UI API fixture: Profile, Memory, new/open/delete conversations, practice separation, Escape, no JS errors; 320/390/1280 widths had no horizontal overflow. Reviewed mobile screenshot. Dedicated dev server started after initial connection unavailable.
- Server22 voice tests, non-root worker/model, Nginx/assets and final anonymous/auth/CSP/readiness checks passed. A transitional502 during app restart cleared by final health acceptance.
- Actual staged Memory/Profile/open/new/delete/signout passed. Real synthetic live reply156,153600 PCM bytes/peak22686; playback complete, mic retained during live, Exit/Escape release, focus containment and chat return passed;0 JS errors.
- Reviewed390x844 and1280x900 live screenshots: theme fills viewport, only Exit visible. Default checkVisibility inventory includes visibility:hidden controls, so visual evidence/inert/focus checks establish shell hiding.
- Evidence: research/voice-chatbot-2026-11-21/evidence-compact-ui-stage-2026-11-23.json. Physical device acceptance remains separate.

## Outcome

- Complete. Requested web UI is deployed and verified at https://ai_test.satishk.com. Synthetic fixture removed; no out-of-scope defect repair.
