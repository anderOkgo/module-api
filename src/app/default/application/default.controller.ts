import { Request, Response } from '../../../helpers/middle.helper';
import _cyfer from '../../../helpers/cyfer.helper';

export const getDefault = (req: Request, res: Response) => {
  res.json({ msg: `API Working: ${_cyfer.cy('hola', 'API Working')}` });
};
