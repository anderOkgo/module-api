import { getFinanService } from './finan.factory';

export const getInitialLoadService = async (data: any) => {
  const finanService = getFinanService();
  return await finanService.getInitialLoad(data);
};

export const putMovementService = async (movement: any) => {
  const finanService = getFinanService();
  return await finanService.putMovement(movement);
};

export const updateMovementService = async (id: number, updatedMovement: any) => {
  const finanService = getFinanService();
  return await finanService.updateMovement(id, updatedMovement);
};

export const deleteMovementService = async (id: number, username: string) => {
  const finanService = getFinanService();
  return await finanService.deleteMovement(id, username);
};
