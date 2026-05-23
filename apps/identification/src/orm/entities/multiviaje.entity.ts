import { db } from '../../config/db';
import type { FindManyOptions } from '../orm';

// ── Shape ─────────────────────────────────────────────────────────────────────

export interface Multiviaje extends Record<string, unknown> {
  id: string;
  servicio_id: number;
  dias: number;
  costo_base: number;
  descuento: number;
  nombre: string;
  descripcion: string | null;
  created_at: Date;
}

export type CreateMultiviajeInput = Pick<Multiviaje, 'servicio_id' | 'dias' | 'costo_base' | 'nombre'> &
  Partial<Pick<Multiviaje, 'descuento' | 'descripcion'>>;

export type UpdateMultiviajeInput = Partial<Pick<Multiviaje, 'servicio_id' | 'dias' | 'costo_base' | 'descuento' | 'nombre' | 'descripcion'>>;

// ── Model ─────────────────────────────────────────────────────────────────────

const table = db.table<Multiviaje>('multiviajes');

export const MultiviajeEntity = {
  findAll(options?: FindManyOptions) {
    return table.findMany(options);
  },

  findById(id: string) {
    return table.findOne({ where: { id } });
  },

  findByServicio(servicio_id: number) {
    return table.findMany({ where: { servicio_id } });
  },

  create(input: CreateMultiviajeInput) {
    return table.create(input);
  },

  update(id: string, input: UpdateMultiviajeInput) {
    return table.update({ where: { id }, data: input });
  },

  delete(id: string) {
    return table.delete({ where: { id } });
  },
};
