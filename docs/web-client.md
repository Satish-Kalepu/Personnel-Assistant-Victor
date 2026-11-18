# Occasional browser client

The browser client is in `backend/web/`. It shares the deployed Mumbai API Gateway and Lambda; chats and memory still use Cognito access tokens and the existing JWT-protected routes. No additional storage, model, or AWS Region is introduced. The live `WebUrl` is `https://zq8981osu8.execute-api.ap-south-1.amazonaws.com/v1/web/index.html`.

## What it does

- Cognito managed sign-in with authorization code and PKCE, and managed logout.
- Personal and English Practice text chat, recent history, new conversation, and Personal memory correction/deletion.
- Separate Pending review and All memory views, a Confirm button, and each fact's original added time in browser-local time with a zone label. Confirmed/corrected facts stay in Victor's graph and All memory.
- Access token held only in page memory. Reloading or closing the tab requires sign-in again. The short-lived PKCE verifier/state is held in session storage only during the redirect.
- No password saving, voice, Gmail, or Auto Record. The Phase 1 secret hold applies to browser messages too.

The page HTML, JavaScript, CSS, and public connection settings are available without signing in. No personal messages or memory are embedded in those assets. The API continues to require a Cognito access token for all personal data routes. User messages are rendered with `textContent` to avoid interpreting HTML.

## Deployment sequence

For a new deployment, set `WebCallbackUrl` to the exact existing `ApiBaseUrl` output plus `/web/index.html`, for example `https://API_ID.execute-api.ap-south-1.amazonaws.com/v1/web/index.html`. The owner approved and executed change set `samcli-deploy1794236511`, which made this correction and removed the unused `/web/` permission while retaining the Android callback.

After deployment, open the `WebUrl` output in a browser. Sign in with the **Victor Cognito** account, not the AWS IAM Identity Center account. The account must complete its temporary-password challenge first. Verify Personal and Practice replies, Practice isolation, Personal memory review/correction/deletion, logout, and rejection of signed-out API requests.

## Cost and limits

Each page asset uses one API Gateway request and one Lambda invocation. For occasional use this avoids another distribution and bucket; if usage grows, move static assets to dedicated hosting. Chat requests still reserve five cents against Victor's $50 monthly app allowance; page loads do not use that allowance but can incur small API/Lambda charges. The account-wide AWS Budget remains an alert, not a hard cap.

The corrected page and assets returned HTTP 200, and `/web` redirected to the page. Cognito's authorization page returned HTTP 200 for the new callback; its private user is `CONFIRMED`. Signed-out `/facts`, `/messages`, and POST `/chat` returned HTTP 401. The owner reports successful browser sign-in, replies in English Practice and Personal, a Personal memory correction and deletion, and sign-out with sign-in required on reload. TASK-011 is complete. The signed-in checks were owner-reported rather than agent-observed.

The owner approved and executed Memory review change set `samcli-deploy1794246063`. The live page and assets include Pending review, All memory, Confirm, and added timestamps; unsigned fact access still returns 401. The owner has not yet verified the new signed-in queue behavior or the displayed local time.
