# Docker MongoDB SaaS migration plan - 2026-11-20

## Prompt
all good. But now I want to simplify things.  lets not use aws cloudformation stack. just delete it and all the properties deployed so far.&#x20;
lets remove serverless idea.&#x20;
create dockerfiles and docker compose yml&#x20;
build respective docker containers&#x20;
use mongodb for database&#x20;
once built locally I will provide access to remote ec2 instance, you can deploy there.&#x20;
so use .env file for settings and create .env.example .env.dev  files  to continue.&#x20;

in dev invironment app will directly load using localhost. but on ec2 it will load via ALB  using a domain.&#x20;
so I will provide domain name, you may have to create target groups in ALB .&#x20;

Let users register using a registration page.  security questions for recovery . email otp for authentication&#x20;
forgot pasword change password features are required

so our app would be a SAAS application, helps many people to use it like a personnel assistant.&#x20;
so each user's data should be safely logically separated. and use necesary indexes to speed querying.&#x20;

plan first, ask questions, identifies vulnerabilities and maintainability issues.

## Questions and decisions
- User requests a replacement Docker/Compose/MongoDB multi-user SaaS architecture, local builds, later EC2/ALB/domain deployment, and retirement of the old CloudFormation/serverless resources.
- Explicit plan-first instruction controls this turn: investigate, document a reviewable plan and ask focused questions. No deletion, application migration/build, production resource or data changes in this planning step.
- Subsequent explicit answers (prompts 003-006): permanently delete old chats/memory; replace security questions with verified-email recovery/recovery codes; private accounts; public free signup; password login with OTP only for registration/recovery; web and Android together; 20 chat turns/day and 5 voice minutes/day/user, one active voice session/user, $50/month application AI guard; SES SMTP Mumbai; OpenAI chat/memory plus Sarvam speech with processing outside Mumbai permitted.
- Full modular TypeScript backend/Compose architecture and sequence remain proposed for review. Preserve prior decisions and incomplete acceptance evidence as history.

## Actions
- Reviewed repository working agreement, current scope/tasks/debt, deployed resource notes, and existing gateway structure.
- Researched primary security, MongoDB, Docker, AWS ALB/deletion/SES, maintained auth-library and official OpenAI onboarding/data-control documentation. Applied the local openai-docs skill when the owner proposed a first API integration; no key required for planning.
- Wrote docs/docker-mongodb-saas-plan.md covering architecture, env/build shape, authentication/recovery, tenant boundaries and indexes, vulnerabilities/maintainability, exact old-deployment retirement, local/Pixel acceptance and later EC2/ALB deployment.
- Read-only AWS inventory found 17 live Victor stack resources and the SAM support stack; processed deployed template confirms DataTable and MonthlyAccountBudget are retained. No secret values or personal contents fetched. Backup/artifact ownership remains an execution-stage check.
- Updated IDEA-015, TASK-014 through TASK-017, proposed DEBT-010, scope and diary. Prior serverless decisions/source preserved; no task marked complete.

## Files changed
- docs/docker-mongodb-saas-plan.md; notes/ideas.md; notes/todo.md; notes/tech-debt.md; notes/v1-scope.md; dairy.md; this prompt and the related answer entries 003-006.
- No runtime source, Dockerfile/Compose/env setting, provider account, AWS resource or personal data changed.

## Verification
- Read-only repository/deployed-stack checks and primary-source research completed. Git diff whitespace check passed for edited tracked planning records (line-ending normalization warnings only). Six new documents passed whitespace checks; all five new prompt entries contain required sections; IDEA-015 and TASK-014 through TASK-017 headings are unique; new idea links resolve.
- Runtime/build/migration/device tests not run: this was the requested planning step. Existing uncommitted application/voice/client work preserved.

## Outcome
- Detailed reviewable plan prepared and requirements/questions resolved through prompt 006. Await owner choice on the proposed consolidated backend and local-proof/retirement/later-EC2 sequence. Nothing deleted, deployed or built in this review.
