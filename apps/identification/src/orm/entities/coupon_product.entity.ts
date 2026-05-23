import { db } from '../../config/db';
import type { FindManyOptions } from '../orm';

// ── Shape ─────────────────────────────────────────────────────────────────────

export interface CouponProduct extends Record<string, unknown> {
  id: string;
  coupon_id: string;
  external_product_id: string;
  external_product_name: string;
}

export type CreateCouponProductInput = Pick<
  CouponProduct,
  'coupon_id' | 'external_product_id' | 'external_product_name'
>;

// ── Model ─────────────────────────────────────────────────────────────────────

const table = db.table<CouponProduct>('coupon_products');

export const CouponProductEntity = {
  findAll(options?: FindManyOptions) {
    return table.findMany(options);
  },

  findById(id: string) {
    return table.findOne({ where: { id } });
  },

  findByCoupon(coupon_id: string) {
    return table.findMany({ where: { coupon_id } });
  },

  create(input: CreateCouponProductInput) {
    return table.create(input);
  },

  delete(id: string) {
    return table.delete({ where: { id } });
  },
};
