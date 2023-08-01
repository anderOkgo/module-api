import { getTotalBank } from './finan.service';
import { finanRepository } from '../../infrastructure/index';

const FinanRepository_ = new finanRepository();

const getTotalBankService = getTotalBank(FinanRepository_);

export { getTotalBankService };
