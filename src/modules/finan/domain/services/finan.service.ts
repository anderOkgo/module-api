import { FinanRepository } from '../../infrastructure/repositories/finan.repository';
import Movement from '../models/Movement';

const getInitialLoad = (finanRepo: FinanRepository) => (data: any) => finanRepo.getInitialLoad(data);

const putMovement = (finanRepo: FinanRepository) => (movement: Movement) => finanRepo.putMovement(movement);

const updateMovement = (finanRepo: FinanRepository) => (id: number, updatedMovement: Movement) =>
  finanRepo.updateMovementById(id, updatedMovement);

const deleteMovement = (finanRepo: FinanRepository) => (id: number, username: string) =>
  finanRepo.deleteMovementById(id, username);

export { getInitialLoad, putMovement, updateMovement, deleteMovement };
