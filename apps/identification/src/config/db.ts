/**
 * Database connection pool — pg Pool singleton.
 * Reused across requests in ECS; persists between Lambda invocations on the same container.
 *
 * NOTE: this module's top-level code reads DATABASE_URL at require() time.
 * In Lambda, index.ts imports this module DYNAMICALLY (after Secrets Manager
 * has populated process.env) to avoid the "DATABASE_URL is not set" error.
 */

import { Pool } from 'pg';
import { createLogger } from './logger';
import { createOrm, type OrmContext } from '../orm/orm';

const logger = createLogger('DB');

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

export const pool: Pool = new Pool({
  connectionString: url,
  min: 1,   // mantiene al menos 1 conexión caliente
  max: 10,  // máximo de conexiones simultáneas
  idleTimeoutMillis: 30_000,    // cierra conexiones idle después de 30s
  connectionTimeoutMillis: 5_000, // falla si no consigue conexión en 5s
});

export const db: OrmContext = createOrm(pool);

pool.on('connect', () => logger.debug('New client connected to pool'));
pool.on('error', (err) => logger.error('Idle pool client error', err));
