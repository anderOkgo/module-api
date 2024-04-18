import { Request, Response } from '../../../helpers/middle.helper';
import {
  getInitialLoadService,
  putMovementService,
  updateMovementService,
  deleteMovementService,
} from '../domain/services/index';

export const defaultFInan = async (req: Request, res: Response) => {
  res.json({ msg: `API Finan Working` });
};

export const getInitialLoad = async (req: Request, res: Response) => {
  const TotalBank = await getInitialLoadService(req.body);
  TotalBank ? res.status(200).json(TotalBank) : res.status(404).json({ error: 'TotalBank not found' });
};

export const putMovement = async (req: Request, res: Response) => {
  const Movement = await putMovementService(req.body);
  Movement ? res.status(200).json({ status: 'successful' }) : res.status(404).json({ error: 'Movement not done' });
};

export const updateMovement = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(id);
  const movementId = parseInt(id, 10); // Convert id to a number using parseInt
  const updatedMovement = await updateMovementService(movementId, req.body);

  if (updatedMovement) {
    res.status(200).json({ status: 'successful' });
  } else {
    res.status(404).json({ error: 'Movement not updated' });
  }
};

export const deleteMovement = async (req: Request, res: Response) => {
  const { id } = req.params;
  const movementId = parseInt(id, 10); // Convert id to a number using parseInt
  const deletedMovement = await deleteMovementService(movementId);

  if (deletedMovement) {
    res.status(200).json({ status: 'successful' });
  } else {
    res.status(404).json({ error: 'Movement not deleted' });
  }
};
