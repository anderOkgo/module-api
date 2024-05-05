import { Request, Response } from '../../../helpers/middle.helper';
import { getProduction, getProductionYear } from '../domain/services/index';
import { validateProduction } from './series.validation';

export const defaultSeries = async (req: Request, res: Response) => {
  res.json({ msg: `API Series Working` });
};

export const getProductions = async (req: Request, res: Response) => {
  try {
    const validationResult = validateProduction(req.body);
    if (!validationResult.valid) return res.status(400).json({ error: validationResult.errors });
    const productions = await getProduction(validationResult.result);

    if (productions) {
      res.status(200).json(productions);
    } else {
      res.status(404).json({ error: 'Productions not found' });
    }
  } catch (error) {
    console.error('Error in getProductions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductionYears = async (req: Request, res: Response) => {
  try {
    const years = await getProductionYear();

    if (years) {
      res.status(200).json(years);
    } else {
      res.status(404).json({ error: 'Production years not found' });
    }
  } catch (error) {
    console.error('Error in getProductionYears:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
