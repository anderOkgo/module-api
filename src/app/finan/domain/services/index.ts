import * as service from './finan.service';
import { finanRepository } from '../../infrastructure/index';

const finanRepo = new finanRepository();

export const getInitialLoadService = service.getInitialLoad(finanRepo);
export const putMovementService = service.putMovement(finanRepo);
export const updateMovementService = service.updateMovement(finanRepo);
export const deleteMovementService = service.deleteMovement(finanRepo);
