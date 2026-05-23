import { db } from '../../config/db';
import type { FindManyOptions } from '../orm';

// ── Shape ─────────────────────────────────────────────────────────────────────

export interface CouponUsage extends Record<string, unknown> {
  id: string;
  coupon_id: string;
  influencer_id: string | null;
  external_order_id: string;
  external_order_ref: string;
  external_user_id: string;
  external_user_name: string;
  discount_applied: number;
  order_total: number;
  used_at: Date;
}

export type CreateCouponUsageInput = Pick<
  CouponUsage,
  | 'coupon_id'
  | 'external_order_id'
  | 'external_order_ref'
  | 'external_user_id'
  | 'external_user_name'
  | 'discount_applied'
  | 'order_total'
> & Partial<Pick<CouponUsage, 'influencer_id'>>;

// ── Model ─────────────────────────────────────────────────────────────────────

const table = db.table<CouponUsage>('coupon_usages');

export const CouponUsageEntity = {
  findAll(options?: FindManyOptions) {
    return table.findMany(options);
  },

  findById(id: string) {
    return table.findOne({ where: { id } });
  },

  findByCoupon(coupon_id: string) {
    return table.findMany({ where: { coupon_id } });
  },

  findByInfluencer(influencer_id: string) {
    return table.findMany({ where: { influencer_id } });
  },

  findByExternalUser(external_user_id: string) {
    return table.findMany({ where: { external_user_id } });
  },

  create(input: CreateCouponUsageInput) {
    return table.create(input);
  },
};
