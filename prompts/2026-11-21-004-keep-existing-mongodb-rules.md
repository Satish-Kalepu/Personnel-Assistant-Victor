# Keep existing MongoDB rules - 2026-11-21

## Prompt
Reply to: May I repair the existing security group by excluding MongoDB port 27017 from the public IPv4/IPv6 20000–30000 rules, retaining all other ports and allowing MongoDB from VPC 172.31.0.0/16? Public remote MongoDB clients would be blocked; local/VPC access and the new private Docker database remain available.
Answer: Nope. keep it. it is a stage server anyway and auth enabled.

## Questions and decisions
- Owner declines the proposed security-group repair and says existing MongoDB authentication is enabled.
- Leave the existing MongoDB service, public range rules and unrelated workloads unchanged. Do not ask again or probe unrelated database contents/authentication.
- This does not change the approved new app architecture: separate authenticated MongoDB/Redis containers on an unpublished private network.

## Actions
- Preserved the exact existing MongoDB/service/security rules. New app uses its own unpublished MongoDB/Redis; stage deployed without changing unrelated listeners/workloads.

## Files changed
- This prompt entry and related stage/decision/debt/diary records. No security-group changes.

## Verification
- No repair performed. Owner statement about existing authentication is recorded as supplied, not independently audited.

## Outcome
- Existing MongoDB/security rules preserved per explicit owner choice. Stage deployment continues.
