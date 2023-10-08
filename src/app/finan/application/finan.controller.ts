import { Request, Response } from '../../../helpers/middle.helper';
import {
  getTotalBankService,
  putMovimentService,
  updateMovimentService,
  deleteMovimentService,
} from '../domain/services/index';

export const defaultFInan = async (req: Request, res: Response) => {
  res.json({ msg: `API Finan Working` });
};

export const getTotalBank = async (req: Request, res: Response) => {
  const TotalBank = await getTotalBankService(req.body.date);
  TotalBank ? res.status(200).json(TotalBank) : res.status(404).json({ error: 'TotalBank not found' });
};

export const putMoviment = async (req: Request, res: Response) => {
  const Moviment = await putMovimentService(req.body);
  Moviment ? res.status(200).json({ status: 'successful' }) : res.status(404).json({ error: 'Moviment not done' });
};

export const updateMoviment = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(id);
  const movimentId = parseInt(id, 10); // Convert id to a number using parseInt
  const updatedMoviment = await updateMovimentService(movimentId, req.body);

  if (updatedMoviment) {
    res.status(200).json({ status: 'successful' });
  } else {
    res.status(404).json({ error: 'Moviment not updated' });
  }
};

export const deleteMoviment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const movimentId = parseInt(id, 10); // Convert id to a number using parseInt
  const deletedMoviment = await deleteMovimentService(movimentId);

  if (deletedMoviment) {
    res.status(200).json({ status: 'successful' });
  } else {
    res.status(404).json({ error: 'Moviment not deleted' });
  }
};
