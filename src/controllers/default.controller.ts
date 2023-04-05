import { Request, Response } from 'express';
import cyfer from '../helpers/cyfer.js';

export const getDefault = (req: Request, res: Response) => {
  res.json({
    msg: `API Working: ${cyfer().cy('hola', 'API Working')}`,
  });
};
