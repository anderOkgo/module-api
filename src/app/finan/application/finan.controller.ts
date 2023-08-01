import { Request, Response } from '../../../helpers/middle.helper';
import { getTotalBankService } from '../domain/services/index';

export const getTotalBank = async (req: Request, res: Response) => {
  const TotalBank = await getTotalBankService();
  TotalBank ? res.status(200).json(TotalBank) : res.status(404).json({ error: 'TotalBank not found' });
};
