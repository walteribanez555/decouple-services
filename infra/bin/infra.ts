#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { DecoupleServicesStack } from "../lib/base-stack";
import { SharedResourcesStack } from "../lib/shared-resources-stack";
import { CostOptimizationAspect, SecurityValidationAspect } from "../lib/validation-aspects";

const app = new cdk.App();

// Get environment from context variable (defaults to dev)
// Usage:  npx cdk deploy ... -c environment=prod
const environment = (app.node.tryGetContext("environment") as string) || "dev";

// Account resolution order:
//   1. AWS_ACCOUNT_ID env var (set from the `aws_account` GitHub repository secret)
//   2. CDK_DEFAULT_ACCOUNT (automatically populated by the CDK CLI from AWS credentials)
// Region follows the same pattern; hard-code to us-east-1 as fallback.
const AWS_ACCOUNT =
  process.env.AWS_ACCOUNT_ID ??
  process.env.CDK_DEFAULT_ACCOUNT ??
  (() => { throw new Error("AWS account not resolved — set AWS_ACCOUNT_ID or configure AWS credentials."); })();
const AWS_REGION = process.env.CDK_DEFAULT_REGION ?? "us-east-1";

// ─── Shared resources (deployed once, region-wide) ────────────────────────────
new SharedResourcesStack(app, "DecoupleServicesSharedStack", {
  env: { account: AWS_ACCOUNT, region: AWS_REGION },
  description: "Shared resources for the decouple-services platform (ECR, alerts, …)",
});

// ─── Environment-specific stack ───────────────────────────────────────────────
const stackName =
  environment === "prod" ? "DecoupleServicesStack-Prod" : "DecoupleServicesStack-Dev";

// Sensitive values (DATABASE_URL, CORS_ORIGINS, LOG_LEVEL) are stored in
// AWS Secrets Manager under decouple-services/{env}/app and fetched by the
// Lambda at cold start — no secrets needed in GitHub or in this file.
const stack = new DecoupleServicesStack(app, stackName, {
  env: { account: AWS_ACCOUNT, region: AWS_REGION },
  appEnv: environment,
  description: `Decouple-services platform — ${environment} environment`,
});

// ─── Validation aspects ───────────────────────────────────────────────────────
cdk.Aspects.of(stack).add(new SecurityValidationAspect(environment));
cdk.Aspects.of(stack).add(new CostOptimizationAspect(environment));
