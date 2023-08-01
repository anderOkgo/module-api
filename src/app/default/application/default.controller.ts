import { Request, Response } from '../../../helpers/middle.helper';
import { encryp } from '../../../helpers/cyfer.helper';

export const getDefault = (req: Request, res: Response) => {
  let a = '';
  console.log(a);
  res.json({ msg: `API Working: ${encryp().cy('hola', 'API Working')}` });
};
