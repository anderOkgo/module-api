import { Request, Response } from '../../../helpers/middle.helper';
import cyfer from '../../../helpers/cyfer';

export const getDefault = (req: Request, res: Response) => {
  res.json({ msg: `API Working: ${cyfer().cy('hola', 'API Working')}` });
};
