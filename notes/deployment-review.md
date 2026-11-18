# Phase 1 deployment review and result — 2026-11-09

**Status:** The initial `victor-phase1` stack reached `CREATE_COMPLETE` with 15 resources. After the approved browser route repair it is `UPDATE_COMPLETE` with 17 resources; the page URL and assets load. SAM's Mumbai artifact bucket/support stack also exists. Android build and signed-in browser checks remain pending.

## Browser client update — change set `samcli-deploy1794235159`

The owner approved and executed this change set on 2026-11-09. The stack reached `UPDATE_COMPLETE` with 18 resources. It added three Lambda route permissions and modified the existing Lambda function, HTTP API, and Cognito app client in place (`Replacement=False` for all three modifications). No table, role, budget, model, or log group changes appeared in the change set.

The new unauthenticated GET routes are `/web`, `/web/`, and `/web/{asset}`. Processed API security retains `CognitoJwt` on POST `/chat`, GET `/messages`, GET `/facts`, PATCH `/facts/{id}`, and DELETE `/facts/{id}`. The public routes only serve the browser shell, CSS/JavaScript, and public API/Cognito connection settings. The browser callback parameter is the existing API URL plus `/web/`; the Android callback remains on the Cognito client. The page uses authorization code with PKCE and holds the access token only in memory.

The page adds a few API Gateway/Lambda requests per load and uses no new paid service. All API/Lambda processing remains in Mumbai. Static page download is public; personal API data still requires Cognito. This update has no new IAM role or policy, but adds three route invoke permissions to the same Lambda.

**Original routing finding:** API Gateway listed `GET /web` and `GET /web/{asset}`, but no `GET /web/`. HTTP checks returned 302 from `/web` to `/web/`, then 404 at `/web/`; JavaScript, CSS, and configuration assets each returned 200. Signed-out `/facts` returned 401. The owner approved serving `index.html` through the existing asset route, redirecting `/web` there, updating the Cognito callback/logout URL and `WebUrl` output, and removing the unused slash route.

**Approved and executed repair:** The owner separately approved execution of change set `samcli-deploy1794236511` on 2026-11-09. It removed `ApiFunctionWebIndexPermission` and modified Lambda, API, and Cognito client in place (`Replacement=False`). The stack reached `UPDATE_COMPLETE` with 17 resources. The live `/web` redirects to `/web/index.html`; the page and three assets returned 200. Cognito's authorize page returned 200 for the new callback, and the app client retains both browser and Android callbacks. The private Cognito user is now `CONFIRMED`. Live routes retain JWT on all five data endpoints; unsigned GET `/facts`, GET `/messages`, and POST `/chat` returned 401. Eleven tests, JavaScript/Python syntax checks, SAM lint, and SAM build passed before deployment. Signed-in behavior was not tested during deployment; the later owner smoke result follows.

**Owner browser smoke test:** The owner reports successful Victor Cognito sign-in, replies in English Practice and Personal, a Personal memory correction and deletion, and sign-out with sign-in required on reload. These signed-in checks were reported by the owner rather than observed by the agent. TASK-011 is complete.

## Memory review update — change set `samcli-deploy1794246063`

Prepared, reviewed, approved, and executed on 2026-11-09. The live stack reached `UPDATE_COMPLETE` with 17 resources, and Lambda is Active with successful update status. It modified `ApiFunction` code and the API definition in place (`Replacement=False`) and added no resources or IAM permissions. The API modification was a resource-attribute dependency of the Lambda update. Live routes still show JWT on all five personal-data methods and NONE only on the two public page routes. An earlier unexecuted draft change set was removed before execution.

The code adds Pending review and All memory views. Confirm and Correct/Save set a `reviewed` marker; the fact remains in Victor's graph and All memory. Existing `corrected=true` facts count as reviewed without migration. `createdAt` is displayed in browser-local time with a zone label and remains unchanged after correction. Strongly consistent table reads make the list reflect completed updates immediately, at a higher DynamoDB read-unit cost than eventual reads. The existing fact list still has a 100-item cap (DEBT-006). Twelve backend tests, a Node rendering test, JavaScript/Python syntax checks, SAM lint, and build passed. After execution, the page, JavaScript, and CSS each returned 200; unsigned `/facts` returned 401. Direct live Lambda tests with two isolated synthetic facts confirmed both review paths, unchanged `createdAt`, and immediate list results; both synthetic facts were removed. Signed-in browser behavior still awaits owner verification.

## Proposed stack

- **Region:** `ap-south-1` only.
- **Identity:** One Cognito user pool, public Android OAuth client, and managed-login domain. User creation is administrator-only.
- **API:** One API Gateway HTTP API with Cognito JWT authorizer; five routes for chat, history, and fact review.
- **Compute and data:** One Python 3.13 ARM64 Lambda, one DynamoDB on-demand table with point-in-time recovery and `Retain` deletion policy, and its IAM execution role. Lambda can access this table and invoke only the selected direct Mumbai Bedrock model ARN.
- **Not in Phase 1:** Audio, ambient recording, Gmail, passkey-protected secrets, and voice.

## Parameters to settle

| Parameter | Current proposal | Status |
| --- | --- | --- |
| `BedrockModelArn` | `arn:aws:bedrock:ap-south-1::foundation-model/mistral.ministral-3-14b-instruct` | Owner selected; account access verified. Quality test pending. |
| `CognitoDomainPrefix` | `victor-private-78d0389e91` | Owner authorized generation; read-only lookup found it unclaimed at check time. AWS checks again at creation. |
| `MonthlyAllowanceCents` | `5000` ($50) | Approved processing allowance; not an AWS bill cap. |
| `ChatReserveCents` | `5` ($0.05) | Owner chose to keep the conservative estimate initially; at most 1,000 chat attempts per month before the app holds further chat. |
| `BudgetAlertEmail` | AWS account email | Owner selected; readable through local SSO profile without storing it in the repository. |

The model is listed at **$0.24 per million input tokens and $0.24 per million output tokens in Mumbai**. As an illustration, 1,000 chats averaging 1,500 input and 500 output tokens would cost about **$0.48 in Bedrock tokens**. The app's 5-cent reservation would count these as $50; it does not represent the actual bill. Long chat context, other AWS services, and later features change the total. [AWS Bedrock pricing](https://aws.amazon.com/bedrock/pricing/).

Cognito's direct-sign-in Essentials/Lite free tier covers up to 10,000 monthly active users per account or organization; the new-pool default is Essentials. API Gateway, Lambda, DynamoDB requests/storage/point-in-time recovery, CloudWatch logs, data transfer, and Bedrock are separately billed. [Cognito pricing](https://aws.amazon.com/cognito/pricing/); [DynamoDB pricing](https://aws.amazon.com/dynamodb/pricing/); [API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/).

## Open deployment issues

- **CloudWatch retention:** The owner approved 14 days. The Lambda uses a named log group with 14-day retention; the template builds and lints. [AWS CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html).
- **Billing alert:** The app reservation is not a charge limit. The deployed $50 monthly account-wide cost budget has three notifications: actual spend above 80% and 100%, and forecast spend above 100%, addressed to the AWS account email. Notifications can arrive after charges accrue. [AWS Budgets behavior](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html).
- **Build architecture:** Basic and lint validation and a local SAM build passed. Docker on this x86_64 machine could not execute the ARM64 build container. The deployed ARM64 Lambda passed direct synthetic invocations for both modes, including Bedrock and DynamoDB writes.
- **Packaging support:** SAM created support bucket `aws-sam-cli-managed-default-samclisourcebucket-72hkdlvg1t6w` and uploaded the Lambda package. This support bucket and its requests/storage can incur small charges.
- **Android:** The source is waiting for an Android Studio build and device verification.
- **Model:** The owner selected direct Mumbai Ministral 14B. Account authorization and in-Region catalog availability passed. Synthetic inference returned a useful English Practice correction. Personal mode returned Markdown-fenced JSON; the owner approved a narrow parser repair. The deployed Lambda returned a Practice reply and a Personal reply with one source-linked fact in synthetic tests. Real user quality remains to be measured.

## Change set inspection

The executed CloudFormation change set had **15 `Add` actions**: Cognito pool/client/domain; API Gateway HTTP API and stage; Lambda function, execution role, and five route permissions; DynamoDB table; 14-day CloudWatch log group; and the $50 AWS Budget. No `Modify` or `Remove` actions appeared. All resources reached `CREATE_COMPLETE`.

All five API methods have the Cognito JWT security scheme. The explicit Lambda role has five DynamoDB actions scoped to this stack's table, `bedrock:InvokeModel` scoped to the selected direct Mumbai model ARN, and two log-stream actions scoped to Victor's log group. It has no AWS-managed logging policy, index wildcard, Gmail, or audio-bucket permissions. DynamoDB point-in-time recovery is enabled and the table is retained on stack deletion. The budget has retain policies for deletion and replacement and sends actual alerts above 80% and 100% and a forecast alert above 100%. The submitted model, domain, allowance, reservation, and AWS-account-email parameters were verified without printing the email or account ID.

**Runtime IAM decision (approved 2026-11-09):** The owner approved replacing SAM's broader generated role. The new change set's processed template has no generated `ApiFunctionRole` and attaches `ApiExecutionRole`. Its inline policy allows only `dynamodb:BatchWriteItem`, `Query`, `GetItem`, `DeleteItem`, and `UpdateItem` on `DataTable`; `bedrock:InvokeModel` on `BedrockModelArn`; and `logs:CreateLogStream` plus `PutLogEvents` on `ApiLogGroup`. The log group is created by CloudFormation, so runtime `logs:CreateLogGroup` is unnecessary. SAM lint and local build passed. Live runtime authorization remains to be tested after deployment.

**Deployment identity:** The change set had no dedicated CloudFormation service role. It executed through the owner's temporary `AdministratorAccess` SSO profile, as selected for initial setup. This administrator is not the app runtime identity. A scoped service role/deployer permission set remains planned for routine updates; it has not been created or tested.

**Use and cost limits:** The 5-cent reservation permits at most 1,000 chats per month across phones and is not actual usage metering. The $50 AWS Budget covers the account, sends delayed notifications, and does not stop services. At a sample 1,500 input plus 500 output tokens per chat, 1,000 chats cost about $0.48 in model tokens at the published Mumbai rate; actual spending also includes API, Lambda, DynamoDB, backup, logs, data transfer, and SAM artifact storage. Unauthenticated API requests returned 401; Android sign-in and authenticated API use remain untested. Phase 1 holds suspected secrets rather than saving or retrieving them, and automatic detection can miss unmarked secrets. Full chat deletion is still pending; avoid entering real credentials until the later passkey slice is built.

## Next validation

1. The first private Cognito user was created with the owner's approved AWS account email and invitation; Cognito still reports `FORCE_CHANGE_PASSWORD`. Finish the first password-change challenge before authenticated API testing.
2. Build and privately install the Android app using the local git-ignored `android/victor.properties` values from stack outputs, then test sign-in, mode isolation, history, and fact review on device.
3. Replace temporary AdministratorAccess with a scoped routine deployment identity after first deployment validation.
