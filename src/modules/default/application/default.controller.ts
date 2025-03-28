import { Request, Response } from '../../../infrastructure/middle.helper';

export const getDefault = (req: Request, res: Response) => {
  return res.json({ msg: `API Working` });
};
