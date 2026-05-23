/**
 * Entry point for AWS Lambda.
 *
 * On cold start: fetches all app secrets from AWS Secrets Manager and
 * injects them into process.env so the rest of the app (config.ts, db.ts …)
 * picks them up transparently.
 *
 * On warm invocations: `init` is already resolved — zero overhead.
 */

import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { handle } from 'hono/aws-lambda';
import { app } from './app';

const client = new SecretsManagerClient({});

// Resolved once per container lifetime (cold start), cached thereafter.
const init: Promise<void> = (async () => {
  const secretArn = process.env.APP_SECRET_ARN;

  if (!secretArn) {
    // Local / non-Lambda execution — env vars already present via .env or shell.
    console.warn('[Lambda] APP_SECRET_ARN not set — using process.env directly.');
    return;
  }

  const { SecretString } = await client.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  );

  if (SecretString) {
    // Merge secret JSON fields into process.env.
    // Existing values (e.g. NODE_ENV set by CDK) are NOT overwritten.
    const secrets = JSON.parse(SecretString) as Record<string, string>;
    for (const [key, value] of Object.entries(secrets)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
    console.info('[Lambda] Secrets loaded from Secrets Manager.');
  }
})();

// Re-use the Hono handler across warm invocations.
const honoHandler = handle(app);

export const handler = async (
  event: Parameters<typeof honoHandler>[0],
  context: Parameters<typeof honoHandler>[1]
) => {
  await init; // instant no-op after first invocation
  return honoHandler(event, context);
};
