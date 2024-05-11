import { FinanRepository } from '../../infrastructure/repositories/finan.repository';
import Movement from '../models/Movement';

export const getInitialLoadService = (finanRepository: FinanRepository) => (data: any) =>
  finanRepository.getInitialLoadRepository(data);

export const putMovementService = (finanRepository: FinanRepository) => (movement: Movement) =>
  finanRepository.putMovementRepository(movement);

export const updateMovementService =
  (finanRepository: FinanRepository) => (id: number, updatedMovement: Movement) =>
    finanRepository.updateMovementByIdRepository(id, updatedMovement);

export const deleteMovementService = (finanRepository: FinanRepository) => (id: number, username: string) =>
  finanRepository.deleteMovementByIdRepository(id, username);
