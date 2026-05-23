# Decouple Services — Age Verification Platform

Monorepo for the age-verification platform. A Flutter mobile app captures an identity document, uploads it directly to S3, and an AWS Lambda backed by Claude Sonnet 4.5 (Bedrock) analyses it and returns a verification result.

---

## Repository structure

```
decouple-services/
├── apps/
│   ├── identification/   # Node.js 22 Lambda — REST API + Bedrock AI analysis
│   └── mobile/           # Flutter iOS app — end-to-end capture & verification flow
├── infra/                # AWS CDK (TypeScript) — all cloud resources
├── turbo.json            # Turborepo task graph
└── package.json          # Root workspace (npm workspaces + Turbo)
```

---

## How it works

```
 iPhone (Flutter)
    │
    │ 1. POST /api/v1/identification/presign
    │    ← { sessionId, uploadUrl }
    │
    │ 2. PUT <uploadUrl>  ──────────────────────────────────► S3 (private bucket)
    │    (streams image directly — never through Lambda)
    │
    │ 3. POST /api/v1/identification/verify  { sessionId }
    │                                                          Lambda
    │                                                            ├─ reads image from S3
    │                                                            ├─ invokes Claude Sonnet 4.5
    │                                                            └─ deletes image from S3
    │    ← VerificationResult { approved, details, rejectedReasons }
```

---

## Apps

| App | README | Language | Description |
|-----|--------|----------|-------------|
| `apps/identification` | [README](apps/identification/README.md) | TypeScript / Node 22 | Lambda REST API — presign, S3 upload, Bedrock AI verification |
| `apps/mobile` | [README](apps/mobile/README.md) | Dart / Flutter 3.41 | iOS app — camera capture, document review, upload & result flow |

## Infrastructure

| Module | README | Description |
|--------|--------|-------------|
| `infra` | [README](infra/README.md) | AWS CDK — API Gateway, Lambda, S3, Bedrock IAM, Secrets Manager |

---

## Live endpoints

| Environment | API Base URL |
|-------------|-------------|
| Dev | `https://cm981m6ag1.execute-api.us-east-1.amazonaws.com` |

---

## Workspace scripts

Run from the repo root:

| Command | Description |
|---------|-------------|
| `npm run build` | Build all apps via Turborepo |
| `npm run dev` | Start all dev servers in parallel |
| `npm run dev:identification` | Start only the identification service locally |
| `npm run lint` | Lint all packages |
| `npm run format` | Prettier format all `*.ts`, `*.tsx`, `*.md` |
| `npm run check-types` | TypeScript type-check all packages |

---

## Cloud resources (dev)

| Resource | Name |
|----------|------|
| Lambda function | `decouple-services-dev-function` |
| API Gateway (HTTP) | `decouple-services-dev` |
| S3 bucket | `decouple-services-dev-verification` |
| Secrets Manager | `decouple-services/dev/app` |
| CloudWatch (Lambda) | `/aws/lambda/decouple-services-dev-function` |
| CloudWatch (API GW) | `/aws/api_gw/decouple-services-dev-api` |
| IAM role | `decouple-services-dev-lambda-exec-role` |

---

## Deploy

```bash
cd infra

# Dev
npx cdk deploy DecoupleServicesStack-Dev

# Prod
npx cdk deploy DecoupleServicesStack-Prod -c environment=prod

# Both stacks
npx cdk deploy --all
```

Requires `AWS_ACCOUNT_ID` or active AWS credentials. Secrets must be pre-populated in Secrets Manager before deploying:

```bash
aws secretsmanager create-secret \
  --name decouple-services/dev/app \
  --secret-string '{"DATABASE_URL":"...","CORS_ORIGINS":"*","LOG_LEVEL":"debug"}'
```

---

## Tech stack at a glance

| Layer | Technology |
|-------|-----------|
| Mobile | Flutter 3.41, Dart 3.11, BLoC/Cubit, GoRouter, Dio |
| API | Hono, Node.js 22, TypeScript, esbuild |
| AI | AWS Bedrock — Claude Sonnet 4.5 (`us.anthropic.claude-sonnet-4-5-20250929-v1:0`) |
| Storage | S3 (presigned PUT, auto-deleted after verify) |
| Infra | AWS CDK v2, API Gateway v2 (HTTP), Lambda, Secrets Manager |
| Monorepo | Turborepo, npm workspaces |
