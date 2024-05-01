import { Request, Response, NextFunction } from '../../../helpers/middle.helper';
import { getInitialLoad, putMovement, updateMovement, deleteMovement } from '../domain/services/index';
import {
  validateGetInitialLoads,
  validatePutMovements,
  validateDeleteMovements,
  validateUpdateMovements,
} from './finan.validations';

export const defaultFInan = async (req: Request, res: Response) => res.json({ msg: `API Finan WWorking` });

export const getInitialLoads = async (req: Request, res: Response, next: NextFunction) => {
  if (!validateGetInitialLoads(req.body)) return res.status(400).json({ error: 'Currency is required' });
  const InitialLoad = await getInitialLoad(req.body);
  InitialLoad ? res.status(200).json(InitialLoad) : res.status(404).json({ error: 'TotalBank Not Found' });
};

export const putMovements = async (req: Request, res: Response, next: NextFunction) => {
  if (!validatePutMovements(req.body)) return res.status(400).json({ error: 'Missing required fields' });
  const Movement = await putMovement(req.body);
  Movement ? res.status(200).json({ status: 'Successful' }) : res.status(404).json({ error: 'Movement Not Done' });
};

export const updateMovements = async (req: Request, res: Response, next: NextFunction) => {
  if (!validateUpdateMovements(req.body))
    return res.status(400).json({ error: 'Missing required fields or invalid input' });
  const Movement = await updateMovement(parseInt(req.params.id), req.body);
  Movement
    ? res.status(200).json({ status: 'Updated Successful' })
    : res.status(404).json({ error: 'Movement Not Updated' });
};

export const deleteMovements = async (req: Request, res: Response, next: NextFunction) => {
  if (!validateDeleteMovements(req.body)) return res.status(400).json({ error: 'Invalid movement ID' });
  const Movement = await deleteMovement(parseInt(req.params.id, 10));
  Movement
    ? res.status(200).json({ status: 'Deleted Successful' })
    : res.status(404).json({ error: 'Movement Not Deleted' });
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};
