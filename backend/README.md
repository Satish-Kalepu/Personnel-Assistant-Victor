# Phase 1 API

AWS SAM template: `template.yaml`. Deploy only to `ap-south-1` after reviewing the model ARN, AWS account, and expected usage cost. The API uses Cognito access JWTs through API Gateway's JWT authorizer; the Lambda trusts only the verified `sub` claim. No client-supplied user ID is accepted.

The deployed Lambda uses an explicit execution role scoped to this stack's DynamoDB table, Victor's CloudWatch log group, and the selected direct Mumbai Bedrock model.

| Method and path | Purpose |
| --- | --- |
| `POST /chat` | `{"mode":"personal|practice","message":"...","conversationId":"optional UUID"}` |
| `GET /messages?mode=personal|practice` | Latest messages in one mode; optional `conversationId` |
| `GET /facts` | Personal graph triples with provenance |
| `PATCH /facts/{id}` | Correct `subject`, `predicate`, or `object`; a reviewed-only request uses `{"reviewed":true}` |
| `DELETE /facts/{id}` | Delete a personal fact |
| `GET /web` and `/web/{asset}` | Public browser redirect, shell, and static assets; chat and memory remain JWT-protected |

The optional browser callback is configured with `WebCallbackUrl`, which must be the deployed API base URL plus `/web/index.html`. See the [browser client guide](../docs/web-client.md). `GET /web` redirects to that page.

The backend rejects suspected password/account-detail messages with `422 secret_hold` before model invocation or storage. It does not yet accept, store, retrieve, or speak secrets. This rule is conservative but cannot recognize all unmarked values.

Before each model call, the backend atomically reserves a configurable amount from a monthly per-owner processing allowance in DynamoDB. The default is 5 cents per chat against a $50 allowance; a held request returns `429 budget_hold`. The reservation is deliberately not refunded after a model attempt because an error may still incur a charge. This is an estimate, not an AWS billing cap, and other processing jobs do not yet share it. Revisit the reservation when the model and its token usage are measured.

The current graph representation is a bounded set of subject–predicate–object triples in a DynamoDB owner partition. Each fact has a source message and conversation ID, timestamp, and confidence. This supports review and simple retrieval; complex graph traversal is a later decision.

The live Memory review update marks a fact `reviewed` when it is confirmed or corrected. Existing records with `corrected=true` are treated as reviewed by the browser without a data migration. The original `createdAt` is preserved. The fact list and single-fact lookup use strongly consistent reads so a confirmation or correction appears immediately after the write; this uses more DynamoDB read capacity than eventual reads. The new signed-in browser behavior still awaits owner verification.

To test locally without AWS:

```text
python -m unittest discover -s backend/tests -v
```

The Phase 1 application stack is deployed in Mumbai. Unauthenticated API requests returned 401, and direct synthetic Lambda invocations passed for Practice and Personal modes. Android sign-in and end-to-end API use remain to be tested.
