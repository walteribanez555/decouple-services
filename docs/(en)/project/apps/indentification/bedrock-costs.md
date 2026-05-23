# Bedrock Cost Structure — Age Verification

Cost model for the age-verification feature based on AWS official pricing (us-east-1, May 2026)
and real measurements against `amazon.nova-lite-v1:0`.

---

## Active configuration

| Parameter | Value |
|---|---|
| Model | `amazon.nova-lite-v1:0` |
| Inference route | Geo cross-region / in-region |
| Service tier | Standard (on-demand) |
| Region | `us-east-1` |
| Confidence threshold | `0.85` |
| Max output tokens | `120` |
| Configured in | `infra/lib/base-stack.ts` → `BEDROCK_MODEL_ID` |

---

## Inference routes

AWS Bedrock offers two routing modes, each with separate pricing.

### Global cross-region (`us.amazon.nova-*`)
Traffic routed across US, EU, and APAC regions for maximum availability.

| Model | Standard input | Standard output | Flex input | Flex output | Batch input | Batch output |
|---|---|---|---|---|---|---|
| Nova 2 Lite | $0.30 | $2.50 | $0.15 | $1.25 | $0.15 | $0.125 |

### Geo cross-region / in-region (`amazon.nova-*`) — **current**
Traffic stays within one geography. All Nova family models are available.

| Model | Standard input | Standard output | Flex input | Flex output | Batch input | Batch output |
|---|---|---|---|---|---|---|
| **Nova Lite** ✅ | **$0.06** | **$0.24** | — | — | **$0.03** | **$0.12** |
| Nova Micro | $0.035 | $0.14 | — | — | $0.0175 | $0.07 |
| Nova Pro | $0.80 | $3.20 | $0.40 | $1.60 | $0.40 | $1.60 |
| Nova Pro (latency opt.) | $1.00 | $4.00 | — | — | — | — |
| Nova Premier | $2.50 | $12.50 | $1.25 | $6.25 | $1.25 | $6.25 |
| Nova 2 Lite | $0.33 | $2.75 | $0.165 | $1.375 | $0.165 | $1.375 |

> `—` = tier not available for that model.

### Priority tier (reserved throughput, guaranteed capacity)

| Model | Input | Output |
|---|---|---|
| Nova 2 Lite (Geo) | $0.5775 | $4.8125 |
| Nova Pro | $1.40 | $5.60 |
| Nova Premier | $4.375 | $21.875 |

> Priority tier adds ~75% over Standard. Used when SLA guarantees on latency are required.

### Prompt caching

All Nova models support prompt caching. Cached input tokens cost **75% less** than on-demand.

| Model | On-demand input | Cache read input |
|---|---|---|
| Nova Lite ✅ | $0.06 / 1M | **$0.015 / 1M** |
| Nova Pro | $0.80 / 1M | $0.20 / 1M |

> Cache hit requires the same prefix (system prompt + user prompt) sent in the previous call within the cache window.

---

## Token breakdown per verification call

Each `POST /api/v1/identification/verify` triggers one Bedrock invocation:

```
┌─────────────────────────────────────────────────────────┐
│  INPUT                                                  │
│  ───────────────────────────────────────────────────    │
│  System prompt (anti-injection rules)           ~450 ⬡  │
│  User prompt (JSON schema + field rules)        ~110 ⬡  │
│  Image (ID document, ~150 KB JPEG)            ~1 900    │
│                                              ────────   │
│  Total input                                 ~2 460     │
│                                                         │
│  OUTPUT                                                 │
│  ───────────────────────────────────────────────────    │
│  JSON result (6 fields, no prose)               ~55     │
└─────────────────────────────────────────────────────────┘

⬡ = cacheable (constant across all calls)
```

**Cacheable tokens:** ~560 (system prompt + user prompt — identical every call).  
**Non-cacheable tokens:** ~1 900 image + ~55 output (unique per call).

**Example output:**

```json
{"is_identity_document":true,"is_adult":true,"appears_authentic":true,"image_quality":"good","confidence":0.95,"dob":"2002-07-01"}
```

---

## Cost per call — Standard tier (current)

```
Input (no cache):
  2 460 tokens × ($0.06 / 1 000 000)  = $0.0001476

Output:
    55 tokens × ($0.24 / 1 000 000)  = $0.0000132
──────────────────────────────────────────────────
Total                                 ≈ $0.000161
```

**With prompt cache hit** (system + user prompt cached, ~560 tokens):

```
Cached input:
    560 tokens × ($0.015 / 1 000 000) = $0.0000084

Non-cached input (image only):
  1 900 tokens × ($0.06  / 1 000 000) = $0.0001140

Output:
     55 tokens × ($0.24  / 1 000 000) = $0.0000132
──────────────────────────────────────────────────
Total with cache                       ≈ $0.000136   (−16%)
```

---

## Real measurements

Tests run against AWS Bedrock (`us-east-1`) with a real JPEG identity document (154 KB).

| Model | Input tokens | Output tokens | Cost / call | Latency | Decision |
|---|---|---|---|---|---|
| `amazon.nova-lite-v1:0` ✅ | 2 493 | 70 | **$0.000166** | 2 416 ms | ✅ Approved |
| `us.amazon.nova-2-lite-v1:0` | 606 | 62 | $0.000337 | 1 893 ms | ✅ Approved |

> Both returned identical results: `confidence: 0.95`, `dob: 2002-07-01`, `image_quality: good`.

### Why Nova Lite over Nova 2 Lite

Nova 2 Lite (Global cross-region) processes images with a more efficient tokenizer — 606 vs ~2 500 input tokens — but its per-token price ($0.30 input) is 5× higher than Nova Lite ($0.06). The result: **Nova 2 Lite costs ~2× more per call** for the same accuracy.

---

## Monthly cost estimates

### Standard tier — current setup

| Monthly verifications | Bedrock | Lambda + API GW | **Total** |
|---|---|---|---|
| 1 000 | $0.17 | ~$0.10 | **~$0.27** |
| 10 000 | $1.66 | ~$0.50 | **~$2.16** |
| 50 000 | $8.30 | ~$2.00 | **~$10.30** |
| 100 000 | $16.60 | ~$4.00 | **~$20.60** |
| 500 000 | $83.00 | ~$15.00 | **~$98.00** |
| 1 000 000 | $166.00 | ~$25.00 | **~$191.00** |

### Batch tier — 50% cheaper, async only

Suitable for non-real-time verification (e.g. backfill, nightly batch jobs).

| Monthly verifications | Bedrock (Batch) | Savings vs Standard |
|---|---|---|
| 10 000 | $0.83 | −$0.83 |
| 100 000 | $8.30 | −$8.30 |
| 500 000 | $41.50 | −$41.50 |
| 1 000 000 | $83.00 | −$83.00 |

### Prompt cache savings (Standard + cache)

| Monthly verifications | Savings |
|---|---|
| 10 000 | −$0.25 |
| 100 000 | −$2.52 |
| 500 000 | −$12.60 |
| 1 000 000 | −$25.20 |

### Supporting AWS costs

| Service | Basis | Approx. cost |
|---|---|---|
| Lambda | 512 MB × ~3 s avg | ~$0.03 / 10k calls |
| API Gateway HTTP | Per request | $1.00 / 1M requests |
| S3 PUT + GET | One object per verification | ~$0.005 / 1k calls |
| S3 storage | 2-day lifecycle rule | ~$0 |

---

## Output token sensitivity

Output tokens cost 4× more per token than input ($0.24 vs $0.06 per 1M). Verbosity has an outsized effect.

| Response type | Output tokens | Cost / call | Δ vs current |
|---|---|---|---|
| Optimised JSON — current | ~55 | $0.0000132 | — |
| + `full_name` + `document_number` | ~80 | $0.0000192 | +$0.0000060 |
| + reasoning / explanation | ~500 | $0.0001200 | +$0.0001068 |

> At **100k calls/month**, adding model reasoning costs ~**$107 extra/month**.

---

## Optimisations applied

| Change | File | Impact |
|---|---|---|
| Removed `full_name` and `document_number` from schema | `identification.service.ts` | −25 output tokens / call |
| Compressed `USER_PROMPT` (~190 → ~110 tokens) | `identification.service.ts` | −80 input tokens / call |
| Set `maxTokens: 120` (was 512) | `identification.service.ts` | Prevents model padding |
| `temperature: 0` | `identification.service.ts` | Deterministic, no retries |

---

## Tier selection guide

| Scenario | Recommended tier | Model ID |
|---|---|---|
| Real-time verification (current) | Standard | `amazon.nova-lite-v1:0` |
| High-traffic with SLA guarantees | Priority | `amazon.nova-lite-v1:0` |
| Batch / backfill / nightly jobs | Batch | `amazon.nova-lite-v1:0` |
| Accuracy-critical edge cases | Standard | `amazon.nova-pro-v1:0` |

---

## Running local cost tests

Compare any model against a real document without deploying:

```bash
cd apps/identification

# Default model (nova-lite)
npx ts-node --project tsconfig.test.json scripts/test-local.ts ~/Downloads/id.jpg

# Side-by-side model comparison
npx ts-node --project tsconfig.test.json scripts/test-local.ts ~/Downloads/id.jpg \
  amazon.nova-lite-v1:0   \
  amazon.nova-pro-v1:0    \
  us.amazon.nova-2-lite-v1:0

# Override model without a deployment
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0 \
  npx ts-node --project tsconfig.test.json scripts/test-local.ts ~/Downloads/id.jpg
```

The script prints **token counts, per-call cost, cost at 1k calls/month**, and the full `VerificationResult`.

---

## Changing the model in production

One file, one line:

```typescript
// infra/lib/base-stack.ts
BEDROCK_MODEL_ID: "amazon.nova-lite-v1:0",   // ← update here
```

The IAM policy already grants access to Nova Lite, Nova Pro, and Nova 2 Lite.  
The adapter (`NovaAdapter` vs `ClaudeAdapter`) is selected automatically at Lambda cold-start.

---

## Cost projection formula

```
cost_per_call =
    (cached_input_tokens   × cache_read_price
  + uncached_input_tokens  × standard_input_price
  + output_tokens          × output_price)
  / 1_000_000

# Nova Lite — Standard tier with prompt cache:
#   cached_input_tokens   = 560   (system + user prompt)
#   cache_read_price      = 0.015
#   uncached_input_tokens = 1 900 (image)
#   standard_input_price  = 0.06
#   output_tokens         = 55
#   output_price          = 0.24
#
# → cost_per_call ≈ $0.000136

monthly_cost = verifications_per_month × cost_per_call
```
