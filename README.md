# Victor — personal assistant

Victor is a private Android assistant backed by serverless AWS services in Mumbai. The approved [v1 scope](notes/v1-scope.md) is being built in slices. The Phase 1 backend is deployed: private Cognito sign-in, text chat, isolated Personal and English Practice modes, and basic personal memory review. Unauthenticated API requests returned 401, and direct synthetic Lambda tests passed for both modes. The Android app has not yet been built or tested on a device.

The [AWS resource plan](notes/aws-resources.md) lists what the Phase 1 template defines and what later features would add.
The [Phase 1 deployment review draft](notes/deployment-review.md) records the current stack, cost assumptions, and decisions needed before deployment.
For account access, follow the [Windows AWS CLI and SSO guide](docs/aws-cli-setup.md).
The [AWS access requirements](aws-requirement.md) state when a local profile is needed and which Phase 1 privileges to prepare.
The [Android build handoff](docs/android-build-handoff.md) gives the builder the remaining device steps.
The [occasional browser client](docs/web-client.md) is live at [Victor web](https://zq8981osu8.execute-api.ap-south-1.amazonaws.com/v1/web/index.html). Public page and signed-out API checks passed; the owner reports successful sign-in, both chat modes, memory correction/deletion, and sign-out.
The live page now includes Pending review, All memory, Confirm, and added timestamps. The owner has not yet checked those new controls in a signed-in browser.

## Quick start

1. Review the [approved scope](notes/v1-scope.md), [tasks](notes/todo.md), and [known limitations](notes/tech-debt.md).
2. Run the backend tests with `python -m unittest discover -s backend/tests -v`.
3. Install Python 3.13, AWS SAM CLI, AWS CLI, and Android Studio with JDK 17 and API 36 before deployment or an Android build. AWS credentials must point to your personal account.
4. In AWS Mumbai (`ap-south-1`), enable a suitable Bedrock Converse model and obtain its model ARN. Confirm pricing and availability before deployment.
5. From `backend/`, run `sam build` and `sam deploy --guided --region ap-south-1`. Supply a unique Cognito domain prefix and the model ARN. Review the CloudFormation changes before approving deployment.
6. Create the private Cognito user through the AWS console or `aws cognito-idp admin-create-user --region ap-south-1 --user-pool-id <output-user-pool-id> --username <your-email> --user-attributes Name=email,Value=<your-email> Name=email_verified,Value=true`. Complete the temporary-password flow at sign-in.
7. The local git-ignored `android/victor.properties` has been filled from the deployed stack outputs. Share that file with the person building the app, or copy `android/victor.properties.example` and fill it from the stack outputs on their computer. Import `android/` in Android Studio, build, and privately install on your phone.

The Android client keeps sign-in tokens in memory only, so relaunching the app requires sign-in again. Phase 1 does not save or retrieve passwords and account numbers. Suspected secret messages are held before any model call and are not stored; detection is imperfect, so do not enter actual credentials until the passkey feature is built and validated.

The backend reads the authenticated Cognito subject from API Gateway's verified JWT claims. Personal and Practice messages use separate DynamoDB partitions. Practice mode never sends Personal memory to the model and never creates graph facts. Personal fact triples contain source message, conversation, time, and confidence, and can be corrected or deleted. DynamoDB encryption at rest and point-in-time recovery are enabled. Full source chats and facts currently remain until deletion functionality is added.

Chat calls now reserve a conservative amount atomically against the owner's monthly processing allowance before calling Bedrock. The default is 5 cents per chat and $50 per month; those figures require review against the selected model and do not limit unrelated AWS charges or future audio jobs.

[`AGENTS.md`](AGENTS.md) contains the operating rules for agents. [`CLAUDE.md`](CLAUDE.md) points Claude to the same rules.

## Project details

- **Purpose:** Private personal assistant with conversation memory.
- **Users:** One owner, potentially using multiple personal Android phones.
- **Stack:** Kotlin Android and a small browser client; AWS Cognito, API Gateway HTTP API, Lambda, DynamoDB, Bedrock.
- **Setup / build:** See Quick start above.
- **Run:** Android client after deploying the API and setting `victor.properties`.
- **Test:** `python -m unittest discover -s backend/tests -v`; Android build and device tests are pending.
- **Deployment:** Phase 1 AWS SAM stack `victor-phase1` is `CREATE_COMPLETE` in `ap-south-1`; Android build/device testing remains pending.

## Records

| File | What goes there |
| --- | --- |
| `notes/ideas.md` | Options under discussion, open questions, and explicit decisions |
| `notes/todo.md` | Actionable work accepted after a decision |
| `notes/tech-debt.md` | Known compromises, risks, and follow-up work |
| `dairy.md` | Dated development activity and outcomes |
| `prompts/YYYY-MM-DD-NNN-short-topic.md` | Each user prompt and the agent's response/work summary |

Keep these records concise and current. A discussion is not authorization to implement an idea or repair a defect.
