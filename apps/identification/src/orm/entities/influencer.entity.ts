import { db } from '../../config/db';
import type { FindManyOptions } from '../orm';

// ── Shape ─────────────────────────────────────────────────────────────────────

export interface Influencer extends Record<string, unknown> {
  id: string;
  full_name: string;
  username: string | null;
  platform: string;
  email: string | null;
  commission_rate: number;
  is_active: boolean;
  created_at: Date;
}

export type CreateInfluencerInput = Pick<Influencer, 'full_name' | 'platform'> &
  Partial<Pick<Influencer, 'username' | 'email' | 'commission_rate' | 'is_active'>>;

export type UpdateInfluencerInput = Partial<
  Pick<Influencer, 'full_name' | 'username' | 'platform' | 'email' | 'commission_rate' | 'is_active'>
>;

// ── Model ─────────────────────────────────────────────────────────────────────

const table = db.table<Influencer>('influencers');

export const InfluencerEntity = {
  findAll(options?: FindManyOptions) {
    return table.findMany(options);
  },

  findById(id: string) {
    return table.findOne({ where: { id } });
  },

  findByEmail(email: string) {
    return table.findOne({ where: { email } });
  },

  findByUsername(username: string) {
    return table.findOne({ where: { username } });
  },

  create(input: CreateInfluencerInput) {
    return table.create(input);
  },

  update(id: string, input: UpdateInfluencerInput) {
    return table.update({ where: { id }, data: input });
  },

  delete(id: string) {
    return table.delete({ where: { id } });
  },
};
