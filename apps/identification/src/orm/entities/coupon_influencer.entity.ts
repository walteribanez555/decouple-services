import { db } from '../../config/db';
import type { FindManyOptions } from '../orm';

// ── Shape ─────────────────────────────────────────────────────────────────────

export interface CouponInfluencer extends Record<string, unknown> {
  id: string;
  coupon_id: string;
  influencer_id: string;
  custom_commission_rate: number | null;
  assigned_at: Date;
}

export type CreateCouponInfluencerInput = Pick<CouponInfluencer, 'coupon_id' | 'influencer_id'> &
  Partial<Pick<CouponInfluencer, 'custom_commission_rate'>>;

// ── Model ─────────────────────────────────────────────────────────────────────

const table = db.table<CouponInfluencer>('coupon_influencers');

export const CouponInfluencerEntity = {
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

  create(input: CreateCouponInfluencerInput) {
    return table.create(input);
  },

  delete(id: string) {
    return table.delete({ where: { id } });
  },
};
