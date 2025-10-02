import { FinanRepository } from '../ports/finan.repository';
import Movement, { UpdateMovementRequest, MovementResponse } from '../../domain/entities/movement.entity';

/**
 * Caso de uso para actualizar un movimiento financiero existente
 * Implementa validaciones y lógica de negocio
 */
export class UpdateMovementUseCase {
  constructor(private readonly repository: FinanRepository) {}

  async execute(
    id: number,
    request: UpdateMovementRequest,
    username: string
  ): Promise<{ success: boolean; message: string; data?: MovementResponse }> {
    try {
      // 1. Validar entrada
      this.validateInput(id, request, username);

      // 2. Verificar que el movimiento existe
      const existing = await this.repository.findById(id, username);
      if (!existing) {
        return {
          success: false,
          message: 'Movement not found',
        };
      }

      // 3. Normalizar y preparar datos actualizados
      const movementUpdate: Partial<Movement> = {
        name: request.movement_name.trim(),
        value: request.movement_val,
        date_movement: request.movement_date,
        type_source_id: request.movement_type,
        tag: request.movement_tag?.trim() || '',
        currency: request.currency.toUpperCase(),
        log: request.operate_for || 0,
      };

      // 4. Actualizar en base de datos
      const updated = await this.repository.update(id, movementUpdate, username);

      // 5. Mapear a respuesta
      const response: MovementResponse = {
        id: updated.id!,
        name: updated.name,
        value: updated.value,
        date_movement: updated.date_movement,
        type_source_id: updated.type_source_id,
        tag: updated.tag,
        currency: updated.currency,
        user: updated.user,
      };

      return {
        success: true,
        message: 'Movement updated successfully',
        data: response,
      };
    } catch (error) {
      console.error('Error in UpdateMovementUseCase:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update movement',
      };
    }
  }

  private validateInput(id: number, request: UpdateMovementRequest, username: string): void {
    const errors: string[] = [];

    if (!id || id <= 0) {
      errors.push('Invalid movement ID');
    }

    if (!username || username.trim().length < 3) {
      errors.push('Valid username is required');
    }

    if (!request.movement_name || request.movement_name.trim().length < 2) {
      errors.push('Movement name must be at least 2 characters');
    }

    if (request.movement_val === undefined || request.movement_val === 0) {
      errors.push('Movement value must be different from zero');
    }

    if (!request.movement_date) {
      errors.push('Movement date is required');
    }

    if (!request.movement_type) {
      errors.push('Movement type is required');
    }

    if (!request.currency) {
      errors.push('Currency is required');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}
