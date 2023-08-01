import { FinanRepository } from '../../infrastructure/repositories/finan.repository';

const getTotalBank = (productionRepository: FinanRepository) => () => productionRepository.getTotalBank();
export { getTotalBank };
