import { Request, Response } from 'express';
import { getProductionsPersistence, getProductionYearsPersistence } from '../infrastructure/production.mysql';

export const getProductionsRepository = (req: Request, res: Response) => {
  return getProductionsPersistence(req, res);
};

export const getProductionYearsRepository = (req: Request, res: Response) => {
  return getProductionYearsPersistence(req, res);
};
