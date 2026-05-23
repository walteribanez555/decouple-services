/**
 * Hono app shared between Lambda (index.ts) and ECS (main.ts)
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config, createLogger } from './config';
import { identificationRoute } from './modules/identification/identification.module';


const logger = createLogger('App');
const { origins, methods, headers } = config.getValue('cors');

export const app = new Hono();

// ── Global middlewares ──────────────────────────────────────────────────────

const corsOrigin = origins.length === 1 && origins[0] === '*'
  ? '*'
  : (origin: string) => (origins.includes(origin) ? origin : origins[0]);

app.use('*', cors({
  origin: corsOrigin,
  allowMethods: methods as string[],
  allowHeaders: headers,
  exposeHeaders: headers,
  credentials: true,
}));


// ── Routes ──────────────────────────────────────────────────────────────────

app.get('/', (c) => {
  logger.info('Root request');
  return c.json({ message: 'Hello from service lambda' });
});

const v1 = new Hono();

v1.get('/health', (c) => {
  logger.info('Health check');
  return c.json({ status: 'ok' });
});

// ── Feature modules ──────────────────────────────────────────────────────────

v1.route('/identification', identificationRoute);
// POST /api/v1/identification/presign  ← get signed S3 upload URL
// POST /api/v1/identification/verify   ← run document analysis via Claude Sonnet


app.route('/api/v1', v1);
