import { db } from '../../config/db';
import type { FindManyOptions } from '../orm';

// ── Shape ─────────────────────────────────────────────────────────────────────

export type ConditionOperator = 'AND' | 'OR';
export type RuleAction = 'enable' | 'disable';

export interface DiscountRule extends Record<string, unknown> {
  id: string;
  discount_id: string;
  name: string;
  condition_operator: ConditionOperator;
  priority: number;
  action: RuleAction;
  field: string | null;
  value: string | null;
  created_at: Date;
}

export type CreateDiscountRuleInput = Pick<DiscountRule, 'discount_id' | 'name' | 'condition_operator' | 'action'> &
  Partial<Pick<DiscountRule, 'priority' | 'field' | 'value'>>;

export type UpdateDiscountRuleInput = Partial<Pick<DiscountRule, 'name' | 'condition_operator' | 'priority' | 'action' | 'field' | 'value'>>;

// ── Model ─────────────────────────────────────────────────────────────────────

const table = db.table<DiscountRule>('discount_rules');

export const DiscountRuleEntity = {
  findAll(options?: FindManyOptions) {
    return table.findMany(options);
  },

  findById(id: string) {
    return table.findOne({ where: { id } });
  },

  findByDiscount(discount_id: string) {
    return table.findMany({ where: { discount_id }, orderBy: { priority: 'ASC' } });
  },

  create(input: CreateDiscountRuleInput) {
    return table.create(input);
  },

  update(id: string, input: UpdateDiscountRuleInput) {
    return table.update({ where: { id }, data: input });
  },

  delete(id: string) {
    return table.delete({ where: { id } });
  },
};
