import { Request, Response, NextFunction } from '../../../helpers/middle.helper';
import { getInitialLoad, putMovement, updateMovement, deleteMovement } from '../domain/services/index';
import {
  validateGetInitialLoads,
  validatePutMovements,
  validateDeleteMovements,
  validateUpdateMovements,
  ValidationResult,
} from './finan.validations';

export const defaultFInan = async (req: Request, res: Response) => res.json({ msg: `API Finan WWorking` });

export const getInitialLoads = async (req: Request, res: Response, next: NextFunction) => {
  const validation = validateGetInitialLoads(req.body);
  if (!validation.isValid) return res.status(400).json({ errors: validation.errors });

  const InitialLoad = await getInitialLoad(req.body);
  InitialLoad ? res.status(200).json(InitialLoad) : res.status(404).json({ error: 'TotalBank Not Found' });
};

export const putMovements = async (req: Request, res: Response, next: NextFunction) => {
  const validation = validatePutMovements(req.body);
  if (!validation.isValid) return res.status(400).json({ errors: validation.errors });

  const Movement = await putMovement(req.body);
  Movement ? res.status(200).json({ status: 'Successful' }) : res.status(404).json({ error: 'Movement Not Done' });
};

export const updateMovements = async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id, 10);
  const validation: ValidationResult = validateUpdateMovements(req.body, id);
  if (!validation.isValid) return res.status(400).json({ errors: validation.errors });

  const Movement = await updateMovement(id, req.body);
  Movement
    ? res.status(200).json({ status: 'Updated Successful' })
    : res.status(404).json({ error: 'Movement Not Updated' });
};

export const deleteMovements = async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id, 10);
  const validation: ValidationResult = validateDeleteMovements(id);
  if (!validation.isValid) return res.status(400).json({ errors: validation.errors });

  const Movement = await deleteMovement(id);
  Movement
    ? res.status(200).json({ status: 'Deleted Successful' })
    : res.status(404).json({ error: 'Movement Not Deleted' });
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};
