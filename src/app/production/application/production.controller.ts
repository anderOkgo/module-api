import { Request, Response } from 'express';
import Production from '../domain/models/Prodution';
import { getProductionService, getProductionYearService } from '../domain/services/index';

export const getProductions = async (req: Request, res: Response) => {
  const {
    id,
    production_name,
    production_number_chapters,
    production_description,
    production_year,
    demographic_name,
    genre_names,
    limit,
  } = req.body;
  const production: Production = {
    id,
    production_name,
    production_number_chapters,
    production_description,
    production_year,
    demographic_name,
    genre_names,
    limit,
  };
  const productions = await getProductionService(production);
  productions ? res.status(200).json(productions) : res.status(404).json({ error: 'Productions not found' });
};

export const getProductionYears = async (req: Request, res: Response) => {
  const years = await getProductionYearService();
  years ? res.status(200).json(years) : res.status(404).json({ error: 'Productions not found' });
};
