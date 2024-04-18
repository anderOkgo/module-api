import { FinanRepository } from '../../infrastructure/repositories/finan.repository';
import Movement from '../models/Movement';

export const getInitialLoad = (finanRepository: FinanRepository) => (data: any) =>
  finanRepository.getInitialLoad(data);

export const putMovement = (finanRepository: FinanRepository) => (movement: Movement) =>
  finanRepository.putMovement(movement);

export const updateMovement = (finanRepository: FinanRepository) => (id: number, updatedMovement: Movement) =>
  finanRepository.updateMovementById(id, updatedMovement);

export const deleteMovement = (finanRepository: FinanRepository) => (id: number) =>
  finanRepository.deleteMovementById(id);
