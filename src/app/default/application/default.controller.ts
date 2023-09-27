import { Request, Response } from '../../../helpers/middle.helper';

export const getDefault = (req: Request, res: Response) => {
  res.json({ msg: `API Working` });
};
