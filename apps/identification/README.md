# Identification Service — Age Verification

Serverless REST API that verifies a user's age by analysing a government-issued identity document photo using **AWS Bedrock (Claude Sonnet 4.5)**.

**Base URL:** `https://cm981m6ag1.execute-api.us-east-1.amazonaws.com/api/v1`

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22.x (AWS Lambda) |
| Framework | [Hono](https://hono.dev) |
| Build | esbuild — `< 50 ms`, minified in production |
| AI model | Claude Sonnet 4.5 via AWS Bedrock (cross-region inference profile) |
| Storage | S3 — temporary image staging (auto-deleted after verify) |
| Infra | AWS CDK — API Gateway → Lambda → Bedrock + S3 |

---

## How it works

```
Client                   Lambda                    AWS
  │                         │                        │
  │  POST /presign           │                        │
  │ ──────────────────────► │                        │
  │  { sessionId, uploadUrl }│                        │
  │ ◄────────────────────── │                        │
  │                         │                        │
  │  PUT <uploadUrl> (image) │                        │
  │ ──────────────────────────────────────────────► S3
  │                         │                        │
  │  POST /verify            │                        │
  │ ──────────────────────► │                        │
  │                         │── getObject ──────────► S3
  │                         │── InvokeModel ────────► Bedrock
  │                         │── deleteObject ───────► S3
  │  VerificationResult      │                        │
  │ ◄────────────────────── │                        │
```

1. **Presign** — client requests a presigned S3 upload URL + a `sessionId`.
2. **Upload** — client PUTs the image directly to S3 (never touches Lambda bandwidth).
3. **Verify** — Lambda reads the image, sends it to Claude Sonnet 4.5 for analysis, deletes the image from S3, and returns the result.

---

## API Reference

### Health

| Method | Path |
|--------|------|
| `GET` | `/api/v1/health` |

```json
{ "status": "ok" }
```

---

### POST `/api/v1/identification/presign`

Request a presigned S3 upload URL before sending the document image.

**Request body**

```json
{ "mimeType": "image/jpeg" }
```

| Field | Type | Required | Values |
|-------|------|:--------:|--------|
| `mimeType` | `string` | ✅ | `image/jpeg` \| `image/png` \| `image/webp` |

**Response `200`**

```json
{
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "uploadUrl": "https://s3.amazonaws.com/...",
    "expiresIn": 300
  }
}
```

| Field | Description |
|-------|-------------|
| `sessionId` | Opaque token — pass it to `POST /verify`. |
| `uploadUrl` | Presigned S3 PUT URL. Set `Content-Type` to the same `mimeType`. |
| `expiresIn` | Seconds until the URL expires (300 s = 5 min). |

> **Important:** The `PUT` request to S3 must include the header `Content-Type: <mimeType>` or S3 will reject it with 403.

---

### POST `/api/v1/identification/verify`

Analyse the uploaded document and return the verification result.

**Request body**

```json
{ "sessionId": "550e8400-e29b-41d4-a716-446655440000" }
```

**Response `200` — Approved**

```json
{
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "approved": true,
    "details": {
      "isAdult": true,
      "appearsAuthentic": true,
      "imageQuality": "good",
      "confidence": 0.97,
      "dob": "1995-03-14"
    },
    "rejectedReasons": []
  }
}
```

**Response `422` — Rejected**

```json
{
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "approved": false,
    "details": {
      "isAdult": false,
      "appearsAuthentic": true,
      "imageQuality": "acceptable",
      "confidence": 0.91,
      "dob": "2010-07-22"
    },
    "rejectedReasons": ["underage"]
  }
}
```

**`rejectedReasons` codes**

| Code | Meaning |
|------|---------|
| `not_identity_document` | Image is not a government-issued ID (selfie, receipt, blank photo, etc.) |
| `underage` | Person is under 18 based on the date of birth on the document |
| `document_not_authentic` | Document shows signs of tampering or forgery |
| `low_confidence` | Model confidence below the configured threshold (default `0.85`) |
| `poor_image_quality` | Image is too blurry or dark to analyse reliably |

> `not_identity_document` is always returned alone — no further checks run when the image is not a valid document.

---

## AI Model — Claude Sonnet 4.5

| Setting | Value |
|---------|-------|
| Model ID | `us.anthropic.claude-sonnet-4-5-20250929-v1:0` |
| Invocation | Cross-region inference profile (required for on-demand throughput) |
| Max tokens | `512` |
| Temperature | `0` (deterministic) |
| Confidence threshold | `0.85` (configurable via `CONFIDENCE_THRESHOLD` env var) |

### What the model extracts

- `is_identity_document` — whether the image is a government-issued document at all
- `full_name` — full legal name as printed
- `dob` — date of birth (`YYYY-MM-DD`)
- `document_number` — ID or passport number
- `is_adult` — calculated from `dob` vs today
- `appears_authentic` — no visible signs of tampering
- `image_quality` — `good` | `acceptable` | `poor`
- `confidence` — overall confidence `0.0–1.0`

### Security — prompt injection & jailbreak prevention

The system prompt enforces strict guardrails:
- Text embedded in the image cannot override the model's role or output format.
- The model never reveals its system prompt or instructions.
- Jailbreak attempts or manipulation trigger the `not_identity_document` fallback with `confidence: 0`.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BEDROCK_MODEL_ID` | Bedrock inference profile ID | `us.anthropic.claude-sonnet-4-5-20250929-v1:0` |
| `S3_VERIFICATION_BUCKET` | Bucket for temporary image staging | `decouple-services-dev-verification` |
| `CONFIDENCE_THRESHOLD` | Minimum confidence to approve (0–1) | `0.85` |
| `CORS_ORIGINS` | Allowed origins (comma-separated or `*`) | `https://app.example.com` |
| `LOG_LEVEL` | Logger level | `debug` \| `info` \| `warn` \| `error` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

Sensitive variables are stored in **AWS Secrets Manager** under `decouple-services/<env>/app` and injected at deploy time.

---

## Error Responses

All errors follow the same envelope:

```json
{ "error": "<message>", "code": "<CODE>" }
```

| Status | Code | Cause |
|--------|------|-------|
| `400` | `MISSING_MIME_TYPE` | `mimeType` not provided in presign request |
| `415` | `UNSUPPORTED_MIME_TYPE` | `mimeType` not in `image/jpeg`, `image/png`, `image/webp` |
| `400` | `MISSING_SESSION_ID` | `sessionId` not provided in verify request |
| `404` | — | Session not found (expired or never uploaded) |
| `422` | — | Verification complete but document rejected (see `rejectedReasons`) |
| `500` | — | Unexpected Lambda or Bedrock error |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Development build (source maps on) |
| `npm run build:prod` | Production build (minified, no source maps) |
| `npm run dev` | Local server via `main.ts` (ECS-compatible) |

## Deploy

```bash
cd infra
npx cdk deploy DecoupleServicesStack-Dev
```

IAM permissions required on the Lambda role:
- `bedrock:InvokeModel` on `arn:aws:bedrock:*:<account>:inference-profile/us.anthropic.claude-sonnet-4*` and `arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4*`
- `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on the verification bucket
- `secretsmanager:GetSecretValue` on the app secret
- `aws-marketplace:ViewSubscriptions`, `aws-marketplace:Subscribe` for first-time Bedrock model activation
