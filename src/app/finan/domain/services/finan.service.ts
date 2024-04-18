import { FinanRepository } from '../../infrastructure/repositories/finan.repository';
import Production from '../models/Prodution';

export const getInitialLoad = (productionRepository: FinanRepository) => (data: any) =>
  productionRepository.getInitialLoad(data);

export const putMovement = (productionRepository: FinanRepository) => (movement: Production) =>
  productionRepository.putMovement(movement);

export const updateMovement =
  (productionRepository: FinanRepository) => (id: number, updatedMovement: Production) =>
    productionRepository.updateMovementById(id, updatedMovement);

export const deleteMovement = (productionRepository: FinanRepository) => (id: number) =>
  productionRepository.deleteMovementById(id);
