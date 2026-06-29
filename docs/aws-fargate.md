# AWS Fargate Deployment

This branch prepares SSVD Report Store for quick production on AWS:

- ECS Fargate runs the Node.js container.
- S3 stores generated files, PDFs, images, JSON exports and ZIP archives.
- DynamoDB stores admin data, users, roles, permissions, saved report indexes and saved report state.
- Secrets Manager stores API keys and credentials.

## Required AWS Resources

### S3

Create one private S3 bucket for report artifacts.

Example:

```text
srisatvam-report-store-prod
```

The app writes files under:

```text
<AWS_S3_PREFIX>/documents/<documentId>/<filename>
```

### DynamoDB

Create one table:

```text
SSVDReportStore
```

Partition key:

```text
pk (String)
```

Sort key:

```text
sk (String)
```

Current item patterns:

```text
pk=CONFIG, sk=ADMIN_STORE
pk=USER#<username>, sk=SAVED_REPORT_INDEX
pk=USER#<username>, sk=SAVED_REPORT#<reportId>
pk=DOC, sk=<documentId>
```

### Secrets Manager

Create a JSON secret and pass its ARN/name as `AWS_SECRETS_ID`.

Example secret value:

```json
{
  "ADMIN_USERNAME": "admin",
  "ADMIN_PASSWORD": "change-this-password",
  "OPENAI_API_KEY": "",
  "ANTHROPIC_API_KEY": "",
  "OFFICIAL_HTTPS_PROXY": ""
}
```

## ECS Task Environment Variables

```text
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
STORAGE_MODE=aws
AWS_REGION=ap-south-1
AWS_DYNAMODB_TABLE=SSVDReportStore
AWS_S3_BUCKET=srisatvam-report-store-prod
AWS_S3_PREFIX=ssvd-report-store/prod
AWS_SECRETS_ID=<secret-name-or-arn>
PLAYWRIGHT_MODULE_URL=playwright
```

Optional:

```text
OPENAI_MODEL=gpt-5.2
OPENAI_VISION_MODEL=gpt-5.2
CLAUDE_MODEL=claude-sonnet-4-5
OFFICIAL_HTTPS_PROXY=<proxy-url>
```

## Minimum IAM Permissions

Attach a task role with:

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
      "Resource": "arn:aws:dynamodb:<region>:<account-id>:table/SSVDReportStore"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::srisatvam-report-store-prod/*"
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

## Container Build

Build and push the image to ECR, then point the ECS Fargate service to that image.

The included `Dockerfile` uses the official Playwright image so Chromium is available in Linux/Fargate.

## Health Check

Use:

```text
/api/health
```

Expected AWS response includes:

```json
{
  "ok": true,
  "storageMode": "aws-s3-dynamodb"
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
