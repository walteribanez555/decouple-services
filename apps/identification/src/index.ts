/**
 * Entry point for AWS Lambda.
 *
 * Problem: db.ts (and every entity file) reads process.env.DATABASE_URL at
 * module load time.  If we statically import './app' at the top of this file,
 * the entire dependency graph (app → config → db → entities) executes before
 * the Secrets Manager fetch has a chance to run, causing:
 *   "Error: DATABASE_URL is not set"
 *
 * Fix: keep the Secrets Manager init at the top level (runs immediately) and
 * import './app' **dynamically** inside the handler.  In the esbuild CJS
 * bundle, each module's factory is executed only on first require(); by
 * deferring the import we guarantee that db.ts factory runs AFTER init has
 * populated process.env.DATABASE_URL.
 *
 * On warm invocations: honoHandler is already set — zero overhead.
 */

import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { handle } from 'hono/aws-lambda'; // safe to import statically — no DB side-effects

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

// Cached after first invocation — created after init so db.ts reads DATABASE_URL correctly.
let honoHandler: ReturnType<typeof handle> | null = null;

export const handler = async (
  event: Parameters<ReturnType<typeof handle>>[0],
  context: Parameters<ReturnType<typeof handle>>[1],
) => {
  // Wait for secrets to be injected into process.env — instant no-op on warm invocations.
  await init;

  if (!honoHandler) {
    // Dynamic import: the entire module graph (app → config/index → db → entities)
    // runs HERE for the first time, after process.env.DATABASE_URL is already set.
    const { app } = await import('./app');
    honoHandler = handle(app);
  }

  return honoHandler(event, context);
};
