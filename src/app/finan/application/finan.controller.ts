import { Request, Response, NextFunction } from '../../../helpers/middle.helper';
import { getInitialLoad, putMovement, updateMovement, deleteMovement } from '../domain/services/index';
import {
  validateGetInitialLoads,
  validatePutMovements,
  validateDeleteMovements,
  validateUpdateMovements,
  ValidationResult,
} from './finan.validations';

export const defaultFInan = async (req: Request, res: Response) => res.json({ msg: `API Finan Working` });

export const getInitialLoads = async (req: Request, res: Response, next: NextFunction) => {
  const validation = validateGetInitialLoads(req.body);
  if (validation.error) return res.status(400).json(validation);
  const resp = await getInitialLoad(req.body);
  if (resp.errorSys) res.status(500).json({ error: true, message: 'Internal server error' });
  resp.error ? res.status(404).json(resp) : res.status(200).json(resp);
};

export const putMovements = async (req: Request, res: Response, next: NextFunction) => {
  const validation = validatePutMovements(req.body);
  if (validation.error) return res.status(400).json(validation);
  const resp = await putMovement(req.body);
  if (resp.errorSys) res.status(500).json({ error: true, message: 'Internal server error' });
  resp.error ? res.status(404).json(resp) : res.status(200).json(resp);
};

export const updateMovements = async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id, 10);
  const validation: ValidationResult = validateUpdateMovements(req.body, id);
  if (validation.error) return res.status(400).json(validation);
  const resp = await updateMovement(id, req.body);
  if (resp.errorSys) res.status(500).json({ error: true, message: 'Internal server error' });
  resp.error ? res.status(404).json(resp) : res.status(200).json(resp);
};

export const deleteMovements = async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id, 10);
  const validation: ValidationResult = validateDeleteMovements(id);
  if (validation.error) return res.status(400).json(validation);
  const resp = await deleteMovement(id);
  if (resp.errorSys) res.status(500).json({ error: true, message: 'Internal server error' });
  resp.error ? res.status(404).json(resp) : res.status(200).json(resp);
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};
