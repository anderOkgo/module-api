import { getInitialLoad, putMovement, updateMovement, deleteMovement } from './finan.service';
import { finanRepository } from '../../infrastructure/index';

const FinanRepository = new finanRepository();

export const getInitialLoadService = getInitialLoad(FinanRepository);
export const putMovementService = putMovement(FinanRepository);
export const updateMovementService = updateMovement(FinanRepository);
export const deleteMovementService = deleteMovement(FinanRepository);
