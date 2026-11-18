# AWS CLI access for Victor (Windows)

The project deploys to the owner's personal AWS account in Mumbai (`ap-south-1`). Do not place AWS passwords, access keys, SSO codes, or cached credentials in this repository or chat.

## 1. Install AWS CLI v2

Download and run the official [current-user Windows MSI](https://awscli.amazonaws.com/AWSCLIV2-User.msi). It does not require administrator rights. Open a **new** PowerShell window and verify:

```powershell
aws --version
```

The output should begin `aws-cli/2.`. [AWS installation instructions](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).

## 2. Temporary bootstrap from an existing root console sign-in

The owner currently signs in to the console as the AWS account root user. AWS CLI v2 (2.32.0+) supports browser-based temporary console credentials:

```powershell
aws login --profile victor-bootstrap --region ap-south-1
aws sts get-caller-identity --profile victor-bootstrap
```

Complete the browser prompt locally. Use this profile only to verify access and set up a separate development identity. Do not use root for routine deployment. `get-caller-identity` should show the intended account; do not paste credentials or authorization codes. [AWS console login guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sign-in.html).

## 3. Set up IAM Identity Center for ongoing development

In the AWS console, select the intended IAM Identity Center home Region (Mumbai if available for this account), open **IAM Identity Center**, and review **Enable**. A standalone AWS account can prompt to create an AWS Organization; review that account-level change before proceeding. Use an **organization instance with multi-account permissions** to grant AWS-account access through permission sets. [Enable guide](https://docs.aws.amazon.com/singlesignon/latest/userguide/enable-identity-center.html).

After enabling, use the [AWS quick start](https://docs.aws.amazon.com/singlesignon/latest/userguide/quick-start-default-idc.html):

1. Add your own Identity Center user with an email you control and complete its invitation/password/MFA setup.
   - The same mailbox as the AWS account root sign-in may be used if it is not already assigned to another Identity Center user. Choose a unique Identity Center username (for example, `victor-admin`); the root and Identity Center sign-ins are distinct.
2. Create an administrative permission set for initial infrastructure setup and assign that user to your personal AWS account. Add a narrower permission set for routine work once deployment actions are known.
3. Copy the **AWS access portal Start URL** and note the **Identity Center Region**. The Region for Identity Center may differ from the CLI default service Region.

## 4. Configure an SSO profile

```powershell
aws configure sso --profile victor
```

At the prompts: session name `victor`; the Start URL from Identity Center; the **Identity Center Region**; registration scopes `sso:account:access`; then choose your personal account and assigned permission set. Set the CLI default Region to `ap-south-1` and output format to `json`.

```powershell
aws sso login --profile victor
aws sts get-caller-identity --profile victor
aws configure get region --profile victor
```

The last command should print `ap-south-1`. A later `aws sso login --profile victor` refreshes the session when it expires. [AWS CLI SSO guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html).

**Deployment gate:** verify the account and Region with the `victor` profile before any `sam deploy`. Phase 1 still needs a direct Mumbai Bedrock model, the chat processing allowance, SAM validation, and an Android build/device check.
