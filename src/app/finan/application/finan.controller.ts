import { Request, Response } from '../../../helpers/middle.helper';
import { getInitialLoad, putMovement, updateMovement, deleteMovement } from '../domain/services/index';
import { validateGetInitialLoads, validatePutMovements, validateDeleteMovements } from './finan.validations';
import { validateUpdateMovements } from './finan.validations';
import { ValidationResult } from './finan.repository';

export const defaultFInan = async (res: Response) => res.json({ msg: `API Finan Working` });

export const getInitialLoads = async (req: Request, res: Response) => {
  const validation = validateGetInitialLoads(req.body);
  if (validation.error) return res.status(400).json(validation);
  const resp = await getInitialLoad(req.body);
  resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
};

export const putMovements = async (req: Request, res: Response) => {
  const validation = validatePutMovements(req.body);
  if (validation.error) return res.status(400).json(validation);
  const resp = await putMovement(req.body);
  resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
};

export const updateMovements = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const validation: ValidationResult = validateUpdateMovements(req.body, id);
  if (validation.error) return res.status(400).json(validation);
  const resp = await updateMovement(id, req.body);
  resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
};

export const deleteMovements = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const username = req.body.username;
  const validation: ValidationResult = validateDeleteMovements(id);
  if (validation.error) return res.status(400).json(validation);
  const resp = await deleteMovement(id, username);
  resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
};
