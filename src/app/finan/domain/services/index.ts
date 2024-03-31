import { getTotalBank, putMovement, updateMovement, deleteMovement } from './finan.service';
import { finanRepository } from '../../infrastructure/index';

const FinanRepository = new finanRepository();

export const getTotalBankService = getTotalBank(FinanRepository);
export const putMovementService = putMovement(FinanRepository);
export const updateMovementService = updateMovement(FinanRepository);
export const deleteMovementService = deleteMovement(FinanRepository);
