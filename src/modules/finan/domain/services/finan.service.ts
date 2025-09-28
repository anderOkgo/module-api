import { FinanRepository } from '../../infrastructure/repositories/finan.repository';
import Movement from '../models/Movement';

// Funciones currificadas eliminadas - usar FinanServiceFactory en su lugar

export class FinanService {
  constructor(private finanRepository: FinanRepository) {}

  async getInitialLoad(data: any) {
    return await this.finanRepository.getInitialLoad(data);
  }

  async putMovement(movement: Movement) {
    return await this.finanRepository.putMovement(movement);
  }

  async updateMovement(id: number, updatedMovement: Movement) {
    return await this.finanRepository.updateMovementById(id, updatedMovement);
  }

  async deleteMovement(id: number, username: string) {
    return await this.finanRepository.deleteMovementById(id, username);
  }
}
