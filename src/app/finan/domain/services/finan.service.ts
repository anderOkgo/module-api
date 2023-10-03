import { FinanRepository } from '../../infrastructure/repositories/finan.repository';
import Production from '../models/Prodution';

export const getTotalBank = (productionRepository: FinanRepository) => (data: any) =>
  productionRepository.getTotalBank(data);

export const putMoviment = (productionRepository: FinanRepository) => (moviment: Production) =>
  productionRepository.putMoviment(moviment);
