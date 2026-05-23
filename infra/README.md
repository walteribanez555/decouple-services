# Infra — AWS CDK

TypeScript CDK project that provisions all cloud resources for the age-verification platform.

**Account:** `682079544132` · **Region:** `us-east-1`

---

## Stacks

| Stack | Description |
|-------|-------------|
| `DecoupleServicesSharedStack` | Shared region-wide resources (ECR, alerts, …) |
| `DecoupleServicesStack-Dev` | Dev environment — API Gateway, Lambda, S3, IAM |
| `DecoupleServicesStack-Prod` | Prod environment — same topology, production settings |

---

## Resources per environment stack

### API Gateway (HTTP v2)
- Protocol: HTTP
- Routes: `ANY /` and `ANY /{proxy+}` → Lambda (AWS_PROXY, payload format 2.0)
- CORS: all origins/methods allowed (tighten in prod via `CORS_ORIGINS` secret)
- Access logs → CloudWatch `/aws/api_gw/{serviceName}-api`

### Lambda
| Setting | Value |
|---------|-------|
| Runtime | Node.js 22.x |
| Handler | `index.handler` |
| Source | `apps/identification/src/index.ts` (bundled via esbuild) |
| Timeout | 10 s |
| Memory | 512 MB |
| Build (dev) | source maps on, not minified |
| Build (prod) | minified, no source maps |

### S3 — Verification Bucket
- Name: `{serviceName}-verification`
- Lifecycle: `sessions/` prefix expires after **2 days** (safety net if Lambda times out)
- All public access blocked, SSL enforced
- Auto-deleted when stack is destroyed

### Secrets Manager
- Secret: `decouple-services/{env}/app`
- Keys: `DATABASE_URL`, `CORS_ORIGINS`, `LOG_LEVEL`
- **Not managed by CDK** — must be created before first deploy (prevents chicken-and-egg placeholder resolution)

### IAM — Lambda execution role
- `AWSLambdaBasicExecutionRole` (CloudWatch Logs)
- `secretsmanager:GetSecretValue` on the app secret
- `s3:GetObject / PutObject / DeleteObject / List` on the verification bucket
- `bedrock:InvokeModel` on:
  - `arn:aws:bedrock:*:{account}:inference-profile/us.anthropic.claude-sonnet-4*`
  - `arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4*`
- `aws-marketplace:ViewSubscriptions / Subscribe / Unsubscribe` (required for first-time Bedrock model activation)

### CloudWatch
- Lambda logs: `/aws/lambda/{serviceName}-function` — 7-day retention
- API GW logs: `/aws/api_gw/{serviceName}-api` — configurable via `apiGwLogRetentionDays`

---

## Environment variables injected into Lambda

| Variable | Source | Value (dev) |
|----------|--------|-------------|
| `NODE_ENV` | CDK | `development` / `production` |
| `DATABASE_URL` | Secrets Manager | PostgreSQL connection string |
| `CORS_ORIGINS` | Secrets Manager | Allowed CORS origins |
| `LOG_LEVEL` | Secrets Manager | `debug` / `info` / `warn` / `error` |
| `S3_VERIFICATION_BUCKET` | CDK (bucket name) | `decouple-services-dev-verification` |
| `BEDROCK_MODEL_ID` | CDK | `us.anthropic.claude-sonnet-4-5-20250929-v1:0` |
| `CONFIDENCE_THRESHOLD` | CDK | `0.85` |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run watch` | Watch + compile |
| `npm run test` | Run Jest unit tests |
| `npx cdk diff` | Compare deployed stack with local changes |
| `npx cdk synth` | Emit CloudFormation template (dry run) |
| `npx cdk deploy DecoupleServicesStack-Dev` | Deploy dev stack |
| `npx cdk deploy DecoupleServicesStack-Prod -c environment=prod` | Deploy prod stack |
| `npx cdk deploy --all` | Deploy all stacks |

---

## First-time setup

### 1. Bootstrap CDK (once per account/region)
```bash
npx cdk bootstrap aws://682079544132/us-east-1
```

### 2. Create the app secret before deploying
```bash
aws secretsmanager create-secret \
  --name decouple-services/dev/app \
  --secret-string '{"DATABASE_URL":"postgresql://user:pass@host:5432/db","CORS_ORIGINS":"*","LOG_LEVEL":"debug"}'
```

### 3. Deploy
```bash
npx cdk deploy DecoupleServicesStack-Dev
```

---

## Validation aspects

Two CDK aspects run on every synth:

| Aspect | Checks |
|--------|--------|
| `SecurityValidationAspect` | Enforces security best practices per environment |
| `CostOptimizationAspect` | Flags resources that may incur unexpected costs |

---

## Notes

- The `$default` API Gateway stage auto-deploys on every Lambda update.
- Bedrock model `us.anthropic.claude-sonnet-4-5-20250929-v1:0` uses a **cross-region inference profile** — direct model IDs (`anthropic.claude-sonnet-4-5-*`) are not supported for on-demand throughput.
- Sensitive env vars are resolved from Secrets Manager **at deploy time** by CloudFormation dynamic references — they are plain `process.env` values inside the Lambda container.
