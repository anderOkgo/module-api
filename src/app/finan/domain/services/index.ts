import { getTotalBank, putMoviment } from './finan.service';
import { finanRepository } from '../../infrastructure/index';

const FinanRepository = new finanRepository();

export const getTotalBankService = getTotalBank(FinanRepository);
export const putMovimentService = putMoviment(FinanRepository);
