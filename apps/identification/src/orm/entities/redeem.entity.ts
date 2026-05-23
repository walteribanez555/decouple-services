import { db } from '../../config/db';
import type { FindManyOptions } from '../orm';

// ── Shape ─────────────────────────────────────────────────────────────────────

export interface Redeem extends Record<string, unknown> {
  id: string;
  discount_id: string;
  polizas: number[];
  service_id: number;
  code_applied: string;
  original_amount: number;
  discount_applied: number;
  date_applied: Date;
  influencer_id: string | null;
  created_at: Date;
}

export type CreateRedeemInput =
  Pick<Redeem, 'discount_id' | 'polizas' | 'service_id' | 'code_applied' | 'original_amount' | 'discount_applied'> &
  Partial<Pick<Redeem, 'influencer_id' | 'date_applied'>>;

// ── Model ─────────────────────────────────────────────────────────────────────

const table = db.table<Redeem>('redeems');

export interface RedeemFilters {
  discount_id?: string;
  influencer_id?: string;
  service_id?: number;
}

export const RedeemEntity = {
  findAll(options?: FindManyOptions) {
    return table.findMany(options);
  },

  findPaginated(filters: RedeemFilters, limit: number, offset: number) {
    return table.findMany({
      where: buildFilters(filters),
      orderBy: { created_at: 'DESC' },
      limit,
      offset,
    });
  },

  async count(filters: RedeemFilters): Promise<number> {
    const where = buildFilters(filters);
    const entries = Object.entries(where);
    const conditions = entries.map(([k, v], i) =>
      v === null ? `"${k}" IS NULL` : `"${k}" = $${i + 1}`,
    );
    const params = entries.filter(([, v]) => v !== null).map(([, v]) => v);
    const clause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await db.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM "redeems" ${clause}`,
      params,
    );
    return parseInt(rows[0]?.total ?? '0', 10);
  },

  findById(id: string) {
    return table.findOne({ where: { id } });
  },

  findByDiscount(discount_id: string) {
    return table.findMany({ where: { discount_id } });
  },

  findByInfluencer(influencer_id: string) {
    return table.findMany({ where: { influencer_id } });
  },

  create(input: CreateRedeemInput) {
    return table.create(input);
  },

  delete(id: string) {
    return table.delete({ where: { id } });
  },
};

function buildFilters(f: RedeemFilters): Record<string, unknown> {
  const w: Record<string, unknown> = {};
  if (f.discount_id)   w['discount_id']   = f.discount_id;
  if (f.influencer_id) w['influencer_id']  = f.influencer_id;
  if (f.service_id)    w['service_id']     = f.service_id;
  return w;
}
