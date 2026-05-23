# CI/CD Workflows

Three workflows cover the full deployment lifecycle — normal pushes, manual production releases, and emergency rollbacks.

---

## Overview

```
Pull Request ──► validate (lint + type-check)

Push to main ──► CI/CD ──► detect changes
                              ├─ infra changed?  → deploy-infra  (CDK)
                              ├─ apps changed?   → deploy-lambda (zip upload)
                              ├─ both?           → deploy-infra → deploy-lambda
                              └─ neither?        → skip deploy
                           → health check
                           (dev only — no release tag)

Production Release ──► CI/CD (environment=prod) ──► same jobs above
  (manual trigger)                                 → health check
                                                   → tag + GitHub Release

Production Rollback ──► validate tag ──► CDK deploy (target tag) ──► health check
  (manual trigger)
```

---

## `cicd.yml` — Main CI/CD pipeline

**File:** [cicd.yml](cicd.yml)

The core pipeline. Called directly on push/PR, and reused by `production-release.yml` via `workflow_call`.

### Triggers

| Trigger | Behaviour |
|---------|-----------|
| `push` to `main` | Deploys to **dev** |
| `push` of tag `v*` | Deploys to **prod** |
| Pull request to `main` | Runs **validate** only (no deploy) |
| `workflow_dispatch` | Manual deploy — choose `dev` or `prod` from the UI |
| `workflow_call` | Called by `production-release.yml` with `environment=prod` |

### Concurrency

One deployment at a time per environment. Concurrent runs are **queued, never cancelled** — a new deploy waits for the current one to finish.

```yaml
concurrency:
  group: deploy-{environment}
  cancel-in-progress: false
```

### Required secrets

| Secret | Used for |
|--------|----------|
| `AWS_ACCESS_KEY_ID` | AWS authentication |
| `AWS_SECRET_ACCESS_KEY` | AWS authentication |
| `aws_account` | CDK environment resolution (`AWS_ACCOUNT_ID`) |
| `DATABASE_URL` | Injected into Secrets Manager before CDK deploy |
| `CORS_ORIGINS` | Injected into Secrets Manager before CDK deploy |
| `LOG_LEVEL` | Injected into Secrets Manager before CDK deploy |

---

### Jobs

#### 1. `changes` — Detect changes & environment

Runs first on every trigger. Determines:
- **Which paths changed** — `infra/**` vs `apps/**` / `packages/**` (via `dorny/paths-filter`)
- **Target environment** — `dev` (default) or `prod` (tag push or explicit input)
- **CDK drift** — runs `cdk diff` and flags if deployed stack differs from local code (skipped on PRs — no AWS secrets available)

Outputs passed to downstream jobs:

| Output | Example |
|--------|---------|
| `environment` | `dev` / `prod` |
| `stack_name` | `DecoupleServicesStack-Dev` |
| `services` | `true` / `false` |
| `infra` | `true` / `false` |
| `infra_drift` | `true` / `false` |

---

#### 2. `validate` — PR gate (required status check)

Runs **only on pull requests**. Blocks merge if any check fails.

| Step | Command |
|------|---------|
| Lint | `npm run lint` (identification app) |
| Type-check app | `npx tsc --noEmit` (identification app) |
| Type-check infra | `npx tsc --noEmit` (infra) |

No AWS credentials needed — purely local checks.

---

#### 3. `deploy-infra` — CDK deploy

Runs when:
- `infra/**` files changed, **or**
- CDK drift was detected, **or**
- Triggered manually (`workflow_dispatch` / `workflow_call`)

Steps in order:
1. **Upsert Secrets Manager** — creates or updates `decouple-services/{env}/app` with `DATABASE_URL`, `CORS_ORIGINS`, `LOG_LEVEL` from GitHub secrets. Must run **before** CDK because CloudFormation resolves dynamic secret references at deploy time.
2. **Ensure shared stack** — deploys `DecoupleServicesSharedStack` if it doesn't exist yet. Fails fast if it's in a `FAILED` / `ROLLBACK` state.
3. **CDK deploy** — `npx cdk deploy {stack_name} -c environment={env} --require-approval never`

---

#### 4. `deploy-lambda` — Fast Lambda code update

Runs when:
- `apps/**` or `packages/**` changed, **or**
- Triggered manually

Always waits for `deploy-infra` to finish (or skips it if infra didn't need deploying). Never runs in parallel with it to avoid race conditions on the same Lambda function.

Steps in order:

| Step | Detail |
|------|--------|
| Lint | Same as validate |
| Build | `npm run build:lambda:prod` — esbuild, minified, single `index.js` bundle |
| Migrate | `npm run migrate` — applies pending DB migrations against `DATABASE_URL` |
| Package | `zip deploy.zip apps/identification/dist/index.js` |
| Size report | Logs bundle size in bytes / KB / MB |
| Deploy | `aws lambda update-function-code --zip-file fileb://deploy.zip` with 5 retries (10 s apart) |

---

#### 5. `health` — Post-deploy verification

Runs after either `deploy-infra` or `deploy-lambda` succeeds. Skipped if both were skipped.

1. Reads the API endpoint from the CloudFormation stack output (`ApiEndpoint`).
2. Waits 5 s for Lambda cold-start.
3. `GET /` — expects HTTP 200 (3 attempts, 10 s apart).
4. `GET /api/v1/health` — expects HTTP 200 (3 attempts, 10 s apart).

Fails the pipeline if the endpoint is unreachable after all retries.

---

#### 6. `tag-release` — GitHub Release (prod only)

Runs after a successful health check on `prod`.

| Step | Detail |
|------|--------|
| Resolve tag | Uses the pushed tag, `inputs.tag_name`, or auto-bumps minor (`v1.2.0 → v1.3.0`) |
| Changelog | `git log {prev}..{tag}` — lists commits since the last release |
| GitHub Release | Creates a release with the changelog, stack name, account, and commit SHA |

---

## `production-release.yml` — Manual production deploy

**File:** [production-release.yml](production-release.yml)

A thin wrapper around `cicd.yml` for one-click production deployments from the GitHub Actions UI.

### Trigger

`workflow_dispatch` only — appears in **Actions → Production Release → Run workflow**.

### Input

| Input | Description | Required |
|-------|-------------|:--------:|
| `tag_name` | Version tag (e.g. `v1.5.0`). Leave empty to auto-bump minor. | No |

### What it does

Calls `cicd.yml` with `environment: prod` and passes `tag_name` and all secrets through (`secrets: inherit`). The full pipeline runs — detect changes → deploy infra → deploy Lambda → health → tag & release.

---

## `rollback.yml` — Emergency production rollback

**File:** [rollback.yml](rollback.yml)

Redeploys a specific previously-released version to production in an emergency. Only operates on `prod`.

### Trigger

`workflow_dispatch` — appears in **Actions → Production Rollback → Run workflow**.

### Inputs

| Input | Description | Required |
|-------|-------------|:--------:|
| `target_version` | Git tag to roll back to (e.g. `v1.3.0`) | ✅ |
| `reason` | Reason for rollback — shown in job summary for audit | ✅ |

### Jobs

#### 1. `validate-rollback`

Guards against invalid or dangerous targets:
- Tag must exist in the repository.
- Tag must not already be the current HEAD.
- Tag's commit must be an ancestor of `main` (prevents deploying from unrelated branches).

Writes a summary table to the GitHub Actions job summary for audit trail.

#### 2. `execute-rollback`

1. Checks out the **target tag** (not `main`).
2. Runs `npm ci` for both workspace and infra deps at that snapshot.
3. Runs `npx cdk deploy DecoupleServicesStack-Prod` — CDK bundles the Lambda from the checked-out code, reverting both infrastructure and application code atomically.
4. Creates an audit tag `rollback-YYYYMMDD-HHMMSS` pointing to the rolled-back commit.

#### 3. `post-rollback-health`

Waits 10 s for Lambda to stabilise, then hits `GET /api/v1/health` up to 3 times (15 s apart). Writes a result summary. Fails loudly if the service is still unhealthy — requires manual intervention.

---

## Environment matrix

| Branch / Tag | Environment | Stack |
|---|---|---|
| `main` push | `dev` | `DecoupleServicesStack-Dev` |
| `v*` tag push | `prod` | `DecoupleServicesStack-Prod` |
| Manual dispatch | chosen | corresponding stack |
| Rollback | `prod` always | `DecoupleServicesStack-Prod` |

---

## Adding a new secret

1. Go to **Settings → Secrets and variables → Actions → New repository secret**.
2. Add the secret.
3. Reference it in the workflow with `${{ secrets.SECRET_NAME }}`.
4. If it's a runtime Lambda variable, also add it to the `Create or update app secret` step in `deploy-infra`.
