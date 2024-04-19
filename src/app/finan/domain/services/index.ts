import {
  getInitialLoadService,
  putMovementService,
  updateMovementService,
  deleteMovementService,
} from './finan.service';
import { finanRepository } from '../../infrastructure/index';

const FinanRepository = new finanRepository();

export const getInitialLoad = getInitialLoadService(FinanRepository);
export const putMovement = putMovementService(FinanRepository);
export const updateMovement = updateMovementService(FinanRepository);
export const deleteMovement = deleteMovementService(FinanRepository);
