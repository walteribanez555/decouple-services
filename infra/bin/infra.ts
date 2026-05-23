#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { DecoupleServicesStack } from "../lib/base-stack";
import { SharedResourcesStack } from "../lib/shared-resources-stack";
import { CostOptimizationAspect, SecurityValidationAspect } from "../lib/validation-aspects";

const app = new cdk.App();

// Get environment from context variable (defaults to dev)
// Usage:  npx cdk deploy ... -c environment=prod
const environment = (app.node.tryGetContext("environment") as string) || "dev";

const AWS_ACCOUNT = "XXXXXXXXXX";
const AWS_REGION = "us-east-1";

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
