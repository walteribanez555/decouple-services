import type { Pool } from 'pg';

export interface Migration {
  /** Unique identifier — matches the filename prefix: YYYYMMDDHHMMSS_name */
  id: string;
  up(pool: Pool): Promise<void>;
  down(pool: Pool): Promise<void>;
}
