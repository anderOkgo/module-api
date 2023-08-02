import { FinanRepository } from '../../infrastructure/repositories/finan.repository';
import Production from '../models/Prodution';

const getTotalBank = (productionRepository: FinanRepository) => () => productionRepository.getTotalBank();
const putMoviment = (productionRepository: FinanRepository) => (moviment: Production) =>
  productionRepository.putMoviment(moviment);

export { getTotalBank, putMoviment };
