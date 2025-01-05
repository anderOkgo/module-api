import { Request, Response } from '../../../infrastructure/middle.helper';
import { getInitialLoadService, putMovementService } from '../domain/services/index';
import { updateMovementService, deleteMovementService } from '../domain/services/index';
import { validateGetInitialLoad, validatePutMovement, validateDeleteMovement } from './finan.validations';
import { validateUpdateMovements } from './finan.validations';
import { ValidationResult } from './finan.repository';

export const defaultFInan = async (res: Response) => res.json({ msg: `API Finan Working` });

export const getInitialLoad = async (req: Request, res: Response) => {
  const validation = validateGetInitialLoad(req.body);
  if (validation.error) return res.status(400).json(validation);

  const resp = await getInitialLoadService(req.body);
  return resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
};

export const putMovement = async (req: Request, res: Response) => {
  const validation = validatePutMovement(req.body);
  if (validation.error) return res.status(400).json(validation);

  const resp = await putMovementService(req.body);
  return resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
};

export const updateMovement = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const validation: ValidationResult = validateUpdateMovements(req.body, id);
  if (validation.error) return res.status(400).json(validation);

  const resp = await updateMovementService(id, req.body);
  return resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
};

export const deleteMovement = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const username = req.body.username;
  const validation: ValidationResult = validateDeleteMovement(id);
  if (validation.error) return res.status(400).json(validation);

  const resp = await deleteMovementService(id, username);
  return resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
};
