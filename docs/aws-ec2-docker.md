# AWS EC2 Docker Deployment

This is the active AWS deployment path for SSVD Report Store.

The app runs as a Docker container on a low-cost EC2 instance with an Elastic IP. The app continues to use AWS-native storage:

- ECR stores Docker images.
- S3 stores generated files, PDFs, images, JSON exports and ZIP archives.
- DynamoDB stores admin data, users, roles, permissions, saved reports and saved report state.
- Secrets Manager stores API keys and credentials.

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

5. Pushes that infra commit, which triggers the infra deploy workflow.
6. The infra workflow uses AWS SSM to pull the new image and restart Docker on EC2.

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

## Container Settings

The included `Dockerfile` is EC2 Docker compatible:

```text
HOST=0.0.0.0
PORT=3000
PLAYWRIGHT_MODULE_URL=playwright
```

The EC2 deployment maps:

```text
public port 80 -> container port 3000
```

Health check path:

```text
/api/health
```

## Secrets Manager

Create or update the JSON secret value:

```json
{
  "ADMIN_USERNAME": "admin",
  "ADMIN_PASSWORD": "SriSatVam@999",
  "OPENAI_API_KEY": "",
  "ANTHROPIC_API_KEY": "",
  "OFFICIAL_HTTPS_PROXY": ""
}
```

## Notes

- This setup starts on HTTP using the EC2 Elastic IP.
- Add a domain and HTTPS later with Caddy/Nginx + Let's Encrypt or an ALB + ACM certificate.
- S3 object access is private. Downloads go through `/api/document/:id`, which retrieves from memory or S3.
- Official Karnataka portals can behave differently from AWS datacenter IPs. If needed, configure a stable outbound proxy with `OFFICIAL_HTTPS_PROXY`.
