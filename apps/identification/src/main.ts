/**
 * Entry point for ECS (server HTTP Node.js)
 */

try { process.loadEnvFile('.env'); } catch { /* .env is optional — env vars injected by the runtime in prod */ }

import { serve } from '@hono/node-server';
import { app } from './app';
import { createLogger } from './config';

const logger = createLogger('Server');
const PORT = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port: PORT }, (info) => {
  logger.info(`Server running on port ${info.port}`);
});
