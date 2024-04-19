import { Request, Response } from '../../../helpers/middle.helper';
import { getInitialLoad, putMovement, updateMovement, deleteMovement } from '../domain/services/index';

export const defaultFInan = async (req: Request, res: Response) => {
  res.json({ msg: `API Finan Working` });
};

export const getInitialLoads = async (req: Request, res: Response) => {
  const InitialLoad = await getInitialLoad(req.body);
  InitialLoad ? res.status(200).json(InitialLoad) : res.status(404).json({ error: 'TotalBank not found' });
};

export const putMovements = async (req: Request, res: Response) => {
  const Movement = await putMovement(req.body);
  Movement ? res.status(200).json({ status: 'successful' }) : res.status(404).json({ error: 'Movement not done' });
};

export const updateMovements = async (req: Request, res: Response) => {
  const { id } = req.params;
  const movementId = parseInt(id, 10);
  const updatedMovement = await updateMovement(movementId, req.body);

  if (updatedMovement) {
    res.status(200).json({ status: 'successful' });
  } else {
    res.status(404).json({ error: 'Movement not updated' });
  }
};

export const deleteMovements = async (req: Request, res: Response) => {
  const { id } = req.params;
  const movementId = parseInt(id, 10);
  const deletedMovement = await deleteMovement(movementId);

  if (deletedMovement) {
    res.status(200).json({ status: 'successful' });
  } else {
    res.status(404).json({ error: 'Movement not deleted' });
  }
};
