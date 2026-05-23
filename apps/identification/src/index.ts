/**
 * Entry point for AWS Lambda.
 *
 * DATABASE_URL, CORS_ORIGINS and LOG_LEVEL are injected as real Lambda
 * environment variables by CloudFormation (resolved from Secrets Manager at
 * deploy time), so process.env is fully populated before any module-level
 * code runs — no runtime SDK fetch required.
 */

import { handle } from 'hono/aws-lambda';
import { app } from './app';

const honoHandler = handle(app);

export const handler = async (
  event: Parameters<typeof honoHandler>[0],
  context: Parameters<typeof honoHandler>[1],
) => honoHandler(event, context);
