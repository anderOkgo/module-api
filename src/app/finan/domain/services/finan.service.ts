import { FinanRepository } from '../../infrastructure/repositories/finan.repository';
import Production from '../models/Prodution';

export const getTotalBank = (productionRepository: FinanRepository) => (data: any) =>
  productionRepository.getTotalBank(data);

export const putMoviment = (productionRepository: FinanRepository) => (moviment: Production) =>
  productionRepository.putMoviment(moviment);

export const updateMoviment =
  (productionRepository: FinanRepository) => (id: number, updatedMoviment: Production) =>
    productionRepository.updateMovimentById(id, updatedMoviment);

export const deleteMoviment = (productionRepository: FinanRepository) => (id: number) =>
  productionRepository.deleteMovimentById(id);
