import { Request, Response } from 'express';
import Production from '../domain/models/Prodution';
import { getProduction, getProductionYears } from '../domain/services/index';

const getProductions = async (req: Request, res: Response) => {
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
  const productions = await getProduction(production);
  productions ? res.status(200).json(productions) : res.status(404).json({ error: 'Productions not found' });
};

const getProductionYear = async (req: Request, res: Response) => {
  const years = await getProductionYears();
  years ? res.status(200).json(years) : res.status(404).json({ error: 'Productions not found' });
};

export { getProductions, getProductionYear };
