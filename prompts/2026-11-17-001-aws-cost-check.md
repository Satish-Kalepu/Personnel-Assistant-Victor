# AWS cost check - 2026-11-17

## Prompt
check aws cost incurred so far

## Questions and decisions
- Checked November month-to-date costs for the configured AWS account, across all services and regions.
- Read-only billing investigation; no resource or permission changes. Account totals are not a project-only allocation.

## Actions
- Read repository AWS access/resource/budget notes and located the existing victor SSO profile without displaying credentials.
- Initial read-only STS request failed because the SSO token expired and refresh failed. Started standard browser sign-in; the owner completed it locally, and AWS CLI confirmed successful login.
- Queried AWS Cost Explorer GetCostAndUsage using UnblendedCost, MONTHLY granularity, grouped by SERVICE and RECORD_TYPE, Start=2026-11-01 and exclusive End=2026-11-18.
- Summed returned groups without intermediate rounding. AWS marked the period Estimated=true.

## Files changed
- prompts/2026-11-17-001-aws-cost-check.md
- dairy.md
- No application, AWS resource, permission, or persistent CLI configuration changes. Normal SSO login refreshed the local authentication cache.

## Verification
- Cost Explorer request succeeded after sign-in. All returned amounts use USD.
- Total: $33.5181438257; pre-tax $28.4181438257; tax $5.10. Rounded total $33.52.
- EC2 Compute recurring: $20.304; EC2 Other: $4.6211618338; VPC: $1.95; Route 53: $1.5234548; S3: $0.0182019868; Bedrock: $0.00115632; API Gateway: $0.0000833; DynamoDB: $0.0000455851; CloudWatch: $0.00004. Other returned services had zero cost.
- No credit or refund groups appeared. No project-specific tag/resource filter was applied; shared-service charges cannot be assigned exclusively to Victor from this result.
- Official AWS documentation says Cost Explorer refreshes at least daily, with some upstream data taking longer than 24 hours: https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html
- No application tests run; application code was not changed.

## Outcome
- Verified latest available account-wide November 1-17 incurred cost: approximately $33.52 including $5.10 tax, estimated rather than final invoice. Recent usage may not yet appear.
