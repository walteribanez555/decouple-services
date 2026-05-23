import { db } from '../../config/db';
import type { FindManyOptions } from '../orm';

// ── Shape ─────────────────────────────────────────────────────────────────────

export interface CouponCategory extends Record<string, unknown> {
  id: string;
  coupon_id: string;
  external_category_id: string;
  external_category_name: string;
}

export type CreateCouponCategoryInput = Pick<
  CouponCategory,
  'coupon_id' | 'external_category_id' | 'external_category_name'
>;

// ── Model ─────────────────────────────────────────────────────────────────────

const table = db.table<CouponCategory>('coupon_categories');

export const CouponCategoryEntity = {
  findAll(options?: FindManyOptions) {
    return table.findMany(options);
  },

  findById(id: string) {
    return table.findOne({ where: { id } });
  },

  findByCoupon(coupon_id: string) {
    return table.findMany({ where: { coupon_id } });
  },

  create(input: CreateCouponCategoryInput) {
    return table.create(input);
  },

  delete(id: string) {
    return table.delete({ where: { id } });
  },
};
