import { Request, Response } from '../../../helpers/middle.helper';
import { getTotalBankService, putMovimentService } from '../domain/services/index';

export const getTotalBank = async (req: Request, res: Response) => {
  const TotalBank = await getTotalBankService(req.body.date);
  TotalBank ? res.status(200).json(TotalBank) : res.status(404).json({ error: 'TotalBank not found' });
};

export const putMoviment = async (req: Request, res: Response) => {
  console.log(req.body);
  const Moviment = await putMovimentService(req.body);
  Moviment ? res.status(200).json({ status: 'successful' }) : res.status(404).json({ error: 'Moviment not done' });
};
