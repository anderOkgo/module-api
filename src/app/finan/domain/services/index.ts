import * as service from './finan.service';
import { finanRepository } from '../../infrastructure/index';

const FinanRepository = new finanRepository();

export const getInitialLoad = service.getInitialLoadService(FinanRepository);
export const putMovement = service.putMovementService(FinanRepository);
export const updateMovement = service.updateMovementService(FinanRepository);
export const deleteMovement = service.deleteMovementService(FinanRepository);
