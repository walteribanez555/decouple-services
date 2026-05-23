import { db } from '../../config/db';
import type { FindManyOptions } from '../orm';

// ── Shape ─────────────────────────────────────────────────────────────────────

export interface Coupon extends Record<string, unknown> {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  created_at: Date;
  updated_at: Date;
}

export type CreateCouponInput = Pick<Coupon, 'code' | 'name'> &
  Partial<Pick<Coupon, 'description' | 'is_active' | 'max_uses'>>;

export type UpdateCouponInput = Partial<
  Pick<Coupon, 'code' | 'name' | 'description' | 'is_active' | 'max_uses'>
>;

// ── Model ─────────────────────────────────────────────────────────────────────

const table = db.table<Coupon>('coupons');

export const CouponEntity = {
  findAll(options?: FindManyOptions) {
    return table.findMany(options);
  },

  findById(id: string) {
    return table.findOne({ where: { id } });
  },

  findByCode(code: string) {
    return table.findOne({ where: { code } });
  },

  create(input: CreateCouponInput) {
    return table.create(input);
  },

  update(id: string, input: UpdateCouponInput) {
    return table.update({ where: { id }, data: { ...input, updated_at: new Date() } });
  },

  delete(id: string) {
    return table.delete({ where: { id } });
  },
};
