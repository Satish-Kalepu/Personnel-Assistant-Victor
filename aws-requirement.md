# AWS access requirements for Victor

**Status:** Phase 1 `victor-phase1` stack and SAM support stack are deployed in Mumbai. The application stack has 17 resources at `UPDATE_COMPLETE` after the approved browser route repair; its page loads. The scoped Lambda runtime role is live; the initial deployment used the owner's temporary AdministratorAccess SSO profile. This document describes current and future access for the [SAM template](backend/template.yaml).

## When to provide access

**Do not send AWS credentials, root password, access keys, SSO codes, or session tokens to the agent or commit them to this repository.** I do not need them while writing code or running local tests.

1. **Read-only account check:** After AWS CLI v2 and IAM Identity Center are configured, sign in locally with `aws sso login --profile victor`. I can then use the temporary `victor` profile to verify the account ID, Region, available Mumbai Bedrock model, and deployment prerequisites. The account and Region check is `aws sts get-caller-identity --profile victor` plus `aws configure get region --profile victor`; the latter should print `ap-south-1`. [AWS CLI SSO guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html).
2. **Deployment:** Only after the stack, model, estimated cost, and IAM permissions are reviewable should the profile gain deployment access. You approve the concrete CloudFormation change set before it is executed. AWS SAM deploys through CloudFormation and can create IAM roles, so its template and options need review. [AWS SAM deploy guidance](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-deploy.html).
3. **Runtime:** The Android app never receives AWS administrator credentials. It signs in to Cognito; the API's Lambda role gets only the table and Bedrock permissions specified by the stack.

The existing root console sign-in may be used to create the Identity Center user and initial permission sets. Do not use a root CLI profile for routine builds or deployment. The local [CLI/SSO setup guide](docs/aws-cli-setup.md) contains the Windows steps.

## Phase 1 deployment permissions

**Preferred arrangement:** create a dedicated CloudFormation service role for the Victor stack, then give the `victor` SSO deployment profile permission to manage only that stack, upload SAM artifacts, and `iam:PassRole` only for that service role. A CloudFormation service role performs stack resource operations; once attached to a stack, it remains attached, so scope it carefully. [CloudFormation service roles](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-iam-servicerole.html).

**User decision (2026-11-09):** use a temporary `AdministratorAccess` Identity Center permission set for the initial setup. After the scoped CloudFormation role and deployer permission set are ready, use those for routine Victor deployment. Do not treat the bootstrap administrator as the app runtime identity.

Have the bootstrap administrator create or designate the SAM artifact bucket in Mumbai. This keeps bucket creation out of the routine deployer's permissions.

| Identity | Required capability for the current template |
| --- | --- |
| Your bootstrap administrator in IAM Identity Center | One-time creation of the scoped deployment permission set, CloudFormation service role, and optional model subscription/approval. It is not the app's runtime identity. |
| `victor` deployer SSO profile | CloudFormation create/update/describe/change-set operations for the Victor stack; S3 upload/read of the SAM deployment-artifact bucket; `iam:PassRole` restricted to the Victor CloudFormation service role; read-only account/Region/model checks. A stack deletion permission is needed only when deletion is explicitly requested. |
| Victor CloudFormation service role | Create/update the resources in the current template: Cognito user pool, domain and public app client; API Gateway HTTP API and authorizer/routes; Lambda function and its execution role/policies; DynamoDB table and point-in-time recovery; required Lambda permissions and a 14-day CloudWatch log group; an account-wide $50 AWS Budget with email notifications. This role does not need access to existing personal data or unrelated stacks. |
| Victor Lambda execution role, explicitly defined in the template | Five required DynamoDB actions on the stack's table; two log-stream write/create actions on Victor's log group; `bedrock:InvokeModel` on the selected **direct Mumbai foundation-model ARN** only. It has no S3 audio, Gmail, or account-administration permissions in Phase 1. |

The present template explicitly defines `ApiExecutionRole` rather than using SAM's generated role and broad CRUD/logging policies. Deployment must acknowledge `CAPABILITY_IAM` because the stack creates IAM resources. The pending change set still has no dedicated CloudFormation service role; first-time execution would use the owner's temporary AdministratorAccess SSO profile chosen for bootstrap. A scoped deployer and service role remain planned for routine updates. [AWS SAM permissions](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-permissions-cloudformation.html), [SAM deploy capabilities](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-deploy.html).

For policy preparation, the deployer will typically need these actions scoped to the Victor stack, artifact bucket, and service role: `cloudformation:CreateChangeSet`, `DescribeChangeSet`, `ExecuteChangeSet`, `DeleteChangeSet`, `DescribeStacks`, `DescribeStackEvents`, `GetTemplateSummary`, `CreateStack`, and `UpdateStack`; `s3:PutObject`, `GetObject`, and `ListBucket`; and `iam:PassRole`. The CloudFormation service role, rather than the deployer, needs the Cognito, API Gateway, Lambda, DynamoDB, IAM-role, and Logs create/update actions for this template. This list is a planning checklist, **not** a ready-to-attach IAM policy.

The selected third-party Bedrock model may need a **one-time** Marketplace subscription/EULA action by your administrator. That does not mean the Lambda needs Marketplace administration after the model is enabled. [Bedrock model-access guidance](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html).

## What is outside Phase 1

- **Audio/Auto Record:** S3 audio bucket, SQS, Step Functions, Transcribe, EventBridge schedules, and their service roles/policies will be requested when that phase is ready. No audio storage permissions are needed now.
- **Gmail:** Google OAuth and Google Cloud Pub/Sub permissions are separate from AWS access. No Gmail credentials or company account access are needed now.
- **Confidential secret retrieval:** KMS key and passkey-verification permissions will be designed and reviewed before that phase. The current app holds suspected secret messages instead of storing them.
- **Billing alerts:** The Phase 1 stack includes a deployed $50 account-wide AWS Budget with three email notifications. The app allowance is a DynamoDB estimate and is not an AWS-wide spending cap. The account email was supplied as a deployment parameter and is not saved in the repository.

## Routine deployment follow-up

**Memory review update (2026-11-09):** The owner approved and executed change set `samcli-deploy1794246063`. It modified the existing Lambda code and HTTP API definition in place, with no new resource or IAM permission. It adds a review marker to fact records, uses strongly consistent table reads for immediate Memory refresh, and serves Pending/All views with added timestamps. The API's five personal-data routes remain JWT-protected; owner verification of the signed-in UI is pending.

**Browser update (2026-11-09):** The owner approved and executed change set `samcli-deploy1794235159`; its `/web/` page URL returned 404. The owner separately approved the source repair and execution of change set `samcli-deploy1794236511`. The live `/web/index.html` page and assets load, and all personal-data routes remain JWT-protected. No new IAM role or policy was created. The page does not need AWS credentials in the browser; it uses Cognito PKCE and the existing JWT API. Signed-in browser behavior still awaits owner testing.

The `victor` IAM Identity Center profile was verified against the intended account and `ap-south-1`. It currently has the temporary AdministratorAccess permission set chosen for bootstrap. Before routine updates, create a dedicated CloudFormation service role and a scoped deployer permission set for this stack and the SAM artifact bucket, then remove the temporary administrator assignment when no longer needed. Do not send SSO codes, access keys, or session tokens in chat.
