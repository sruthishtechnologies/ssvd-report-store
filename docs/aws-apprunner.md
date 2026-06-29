# AWS App Runner Deployment

This branch prepares SSVD Report Store for AWS App Runner with AWS-native storage:

- App Runner runs the Node.js container and provides the public HTTPS URL.
- ECR stores the Docker image.
- S3 stores generated files, PDFs, images, JSON exports and ZIP archives.
- DynamoDB stores admin data, users, roles, permissions, saved report indexes and saved report state.
- Secrets Manager stores API keys and credentials.

## Important App Runner Notes

- AWS documentation currently says App Runner is no longer open to new AWS customers. Existing App Runner customers can continue using it.
- App Runner is not currently listed in AWS endpoint data for Hyderabad (`ap-south-2`). Use Mumbai (`ap-south-1`) for an India-hosted App Runner deployment.

## Container Settings

The included `Dockerfile` is App Runner compatible:

```text
HOST=0.0.0.0
PORT=3000
PLAYWRIGHT_MODULE_URL=playwright
```

App Runner should be configured with container port:

```text
3000
```

Health check path:

```text
/api/health
```

## Automated Release Workflow

The app repo includes `.github/workflows/release-image.yml`.

On push to `main`, it:

1. Builds the Docker image.
2. Validates `src/server.js` and `src/public/app.js` inside the image.
3. Pushes `<app-commit-sha>` and `latest` tags to ECR.
4. Updates the infra repo file `terraform/image.auto.tfvars` with:

```hcl
image_tag = "<app-commit-sha>"
```

5. Pushes that infra commit, which triggers the infra deploy workflow and updates App Runner.

Required app repo secrets:

```text
AWS_GITHUB_ACTIONS_ROLE_ARN=<github actions deploy role arn>
INFRA_REPO_TOKEN=<classic PAT or fine-grained token with contents:write on infra repo>
```

If not using OIDC, add these instead of `AWS_GITHUB_ACTIONS_ROLE_ARN`:

```text
AWS_ACCESS_KEY_ID=<deploy access key>
AWS_SECRET_ACCESS_KEY=<deploy secret key>
```

Optional app repo variables:

```text
AWS_REGION=ap-south-1
ECR_REPOSITORY=ssvd-report-store-prod
INFRA_BRANCH=main
```

For branch testing before merge, keep `INFRA_BRANCH=aws_apprunner`.

## Runtime Environment Variables

The infra repo injects:

```text
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
STORAGE_MODE=aws
AWS_REGION=ap-south-1
AWS_DYNAMODB_TABLE=<table>
AWS_S3_BUCKET=<bucket>
AWS_S3_PREFIX=ssvd-report-store/prod
AWS_SECRETS_ID=<secret-name-or-arn>
PLAYWRIGHT_MODULE_URL=playwright
OPENAI_MODEL=gpt-5.2
OPENAI_VISION_MODEL=gpt-5.2
CLAUDE_MODEL=claude-sonnet-4-5
```

## Secrets Manager

Create or update the JSON secret value:

```json
{
  "ADMIN_USERNAME": "admin",
  "ADMIN_PASSWORD": "change-this-password",
  "OPENAI_API_KEY": "",
  "ANTHROPIC_API_KEY": "",
  "OFFICIAL_HTTPS_PROXY": ""
}
```

## IAM Permissions

The App Runner instance role needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem"
      ],
      "Resource": "arn:aws:dynamodb:<region>:<account-id>:table/<table>"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::<bucket>/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "<secret-arn>"
    }
  ]
}
```

App Runner also needs an ECR access role with `AWSAppRunnerServicePolicyForECRAccess` to pull the private image.

## Health Check

Expected AWS response includes:

```json
{
  "ok": true,
  "storageMode": "aws-s3-dynamodb",
  "awsRegion": "ap-south-1"
}
```

If AWS variables are missing, the app falls back to local files and the health response shows:

```json
{
  "storageMode": "local-files"
}
```

## Notes

- DynamoDB currently stores user passwords the same way the local JSON store did. Before public production, replace this with password hashing or Cognito.
- S3 object access is private. Downloads go through `/api/document/:id`, which retrieves from memory or S3.
- Official Karnataka portals can behave differently from AWS datacenter IPs. If needed, configure a stable outbound proxy with `OFFICIAL_HTTPS_PROXY`.
