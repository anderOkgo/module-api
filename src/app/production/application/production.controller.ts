import { Request, Response } from 'express';
import { getProductionService, getProductionYearService } from '../domain/services/index';

export const getProductions = async (req: Request, res: Response) => {
  const productions = await getProductionService(req.body);
  productions ? res.status(200).json(productions) : res.status(404).json({ error: 'Productions not found' });
};

export const getProductionYears = async (req: Request, res: Response) => {
  const years = await getProductionYearService();
  years ? res.status(200).json(years) : res.status(404).json({ error: 'Productions not found' });
};
