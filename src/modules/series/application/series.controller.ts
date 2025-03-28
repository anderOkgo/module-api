import { Request, Response } from '../../../infrastructure/middle.helper';
import { getProductionsService, getProductionYearsService } from '../domain/services/index';
import { validateProduction } from './series.validation';

export const defaultSeries = async (req: Request, res: Response) => res.json({ msg: 'API Series Working' });

export const getProductions = async (req: Request, res: Response) => {
  const validationResult = validateProduction(req.body);
  if (!validationResult.valid) return res.status(400).json(validationResult.errors);

  const resp = await getProductionsService(validationResult.result);
  return resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
};

export const getProductionYears = async (req: Request, res: Response) => {
  const resp = await getProductionYearsService();
  return resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
};
