import { Request, Response } from 'express';
import { getProductionsRepository, getProductionYearsRepository } from '../domain/production.repository';

export const getProductions = (req: Request, res: Response) => {
  return getProductionsRepository(req, res);
};

export const getProductionYears = (req: Request, res: Response) => {
  return getProductionYearsRepository(req, res);
};
