import { FinanTransaction } from '../ports/finan.repository';
import { MovementType } from '../../domain/entities/movement.entity';

/** C2 and C3's answer when the origin balance does not exist (Finanz SPEC v0.10, L.2). */
export const LINKED_NOT_FOUND = 'Linked movement not found';

/**
 * What a movement does to its origin balance (Finanz SPEC v0.10, M1): an income adds its value, an expense or a
 * balance takes it away, any other type does nothing.
 */
export const effectOn = (type: number, value: number): number => {
  const amount = Number(value);
  if (Number(type) === MovementType.INCOME) return amount;
  if (Number(type) === MovementType.EXPENSE || Number(type) === MovementType.TRANSFER) return -amount;
  return 0;
};

/** A movement's origin id, or null when it has none (`log` is 0 or NULL then, M2). */
export const originOf = (log: unknown): number | null => {
  const id = Number(log);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/** Applies a movement's effect to its origin; throws when that origin does not exist (as create always did, M4). */
export const applyTo = async (
  tx: FinanTransaction,
  origin: number | null,
  type: number,
  value: number,
  username: string
): Promise<void> => {
  if (origin === null) return;
  if (!(await tx.adjustValue(origin, effectOn(type, value), username))) throw new Error(LINKED_NOT_FOUND);
};

/** Undoes a movement's effect on its origin; an origin that no longer exists is skipped (L.2). */
export const undoOn = async (
  tx: FinanTransaction,
  origin: number | null,
  type: number,
  value: number,
  username: string
): Promise<void> => {
  if (origin === null) return;
  await tx.adjustValue(origin, -effectOn(type, value), username);
};
