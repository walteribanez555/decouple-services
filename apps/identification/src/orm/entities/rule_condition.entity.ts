import { db } from '../../config/db';
import type { FindManyOptions } from '../orm';

// ── Shape ─────────────────────────────────────────────────────────────────────

export type Scope =
  | 'scalar'
  | 'array:all'
  | 'array:any'
  | 'array:none'
  | 'array:count'
  | 'array:length';

export type Operator =
  | 'eq' | 'neq'
  | 'gt' | 'gte'
  | 'lt' | 'lte'
  | 'in' | 'not_in'
  | 'between'
  | 'contains'
  | 'multiple_of';

export interface RuleCondition extends Record<string, unknown> {
  id: string;
  rule_id: string;
  scope: Scope;
  field: string;
  operator: Operator;
  value: unknown;
  operator_inner: Operator | null;
  value_inner: unknown | null;
  created_at: Date;
}

export type CreateRuleConditionInput =
  Pick<RuleCondition, 'rule_id' | 'field' | 'operator' | 'value'> &
  Partial<Pick<RuleCondition, 'scope' | 'operator_inner' | 'value_inner'>>;

// ── Model ─────────────────────────────────────────────────────────────────────

const table = db.table<RuleCondition>('rule_conditions');

export const RuleConditionEntity = {
  findAll(options?: FindManyOptions) {
    return table.findMany(options);
  },

  findById(id: string) {
    return table.findOne({ where: { id } });
  },

  findByRule(rule_id: string) {
    return table.findMany({ where: { rule_id } });
  },

  create(input: CreateRuleConditionInput) {
    return table.create(input);
  },

  delete(id: string) {
    return table.delete({ where: { id } });
  },
};
