import { getTotalBank, putMoviment, updateMoviment, deleteMoviment } from './finan.service';
import { finanRepository } from '../../infrastructure/index';

const FinanRepository = new finanRepository();

export const getTotalBankService = getTotalBank(FinanRepository);
export const putMovimentService = putMoviment(FinanRepository);
export const updateMovimentService = updateMoviment(FinanRepository);
export const deleteMovimentService = deleteMoviment(FinanRepository);
