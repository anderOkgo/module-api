import { FinanRepository } from '../../infrastructure/repositories/finan.repository';
import Production from '../models/Prodution';

export const getTotalBank = (productionRepository: FinanRepository) => (data: any) =>
  productionRepository.getTotalBank(data);

export const putMovement = (productionRepository: FinanRepository) => (movement: Production) =>
  productionRepository.putMovement(movement);

export const updateMovement =
  (productionRepository: FinanRepository) => (id: number, updatedMovement: Production) =>
    productionRepository.updateMovementById(id, updatedMovement);

export const deleteMovement = (productionRepository: FinanRepository) => (id: number) =>
  productionRepository.deleteMovementById(id);
