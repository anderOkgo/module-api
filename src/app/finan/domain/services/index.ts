import { getTotalBank, putMoviment } from './finan.service';
import { finanRepository } from '../../infrastructure/index';

const FinanRepository_ = new finanRepository();

const getTotalBankService = getTotalBank(FinanRepository_);
const putMovimentService = putMoviment(FinanRepository_);

export { getTotalBankService, putMovimentService };
