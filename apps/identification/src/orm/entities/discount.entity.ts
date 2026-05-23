import { db } from '../../config/db';
import type { FindManyOptions } from '../orm';

// ── Shape ─────────────────────────────────────────────────────────────────────

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type AppliesTo = 'all' | 'categories' | 'products';

export interface Discount extends Record<string, unknown> {
  id: string;
  coupon_id: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  applies_to: AppliesTo;
  initial_date: Date | null;
  end_date: Date | null;
  min_days: number | null;
  max_days: number | null;
  allowed_countries: string[] | null;
  denied_countries: string[] | null;
  allowed_offices: number[] | null;
  denied_offices: number[] | null;
  services: string[] | null;
  created_at: Date;
}

export type CreateDiscountInput =
  Pick<Discount, 'discount_type' | 'discount_value' | 'applies_to'> &
  Partial<Pick<Discount,
    | 'coupon_id'
    | 'initial_date'
    | 'end_date'
    | 'min_days'
    | 'max_days'
    | 'min_order_amount'
    | 'max_discount_amount'
    | 'allowed_countries'
    | 'denied_countries'
    | 'allowed_offices'
    | 'denied_offices'
    | 'services'
  >>;

export type UpdateDiscountInput = Partial<Pick<Discount,
  | 'discount_type'
  | 'discount_value'
  | 'applies_to'
  | 'coupon_id'
  | 'initial_date'
  | 'end_date'
  | 'min_days'
  | 'max_days'
  | 'min_order_amount'
  | 'max_discount_amount'
  | 'allowed_countries'
  | 'denied_countries'
  | 'allowed_offices'
  | 'denied_offices'
  | 'services'
>>;

// ── Model ─────────────────────────────────────────────────────────────────────

const table = db.table<Discount>('discounts');

export const DiscountEntity = {
  findAll(options?: FindManyOptions) {
    return table.findMany(options);
  },

  findById(id: string) {
    return table.findOne({ where: { id } });
  },

  findByCoupon(coupon_id: string) {
    return table.findMany({ where: { coupon_id } });
  },

  findStandalone() {
    return table.findMany({ where: { coupon_id: null } });
  },

  create(input: CreateDiscountInput) {
    return table.create(input);
  },

  update(id: string, input: UpdateDiscountInput) {
    return table.update({ where: { id }, data: input as Record<string, unknown> });
  },

  delete(id: string) {
    return table.delete({ where: { id } });
  },
};
