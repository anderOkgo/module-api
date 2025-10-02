import { FinanRepository } from '../ports/finan.repository';
import Movement, {
  CreateMovementRequest,
  MovementResponse,
  MovementType,
} from '../../domain/entities/movement.entity';

/**
 * Caso de uso para crear un nuevo movimiento financiero
 * Implementa la lógica de negocio para la creación de movimientos
 */
export class PutMovementUseCase {
  constructor(private readonly repository: FinanRepository) {}

  async execute(
    request: CreateMovementRequest
  ): Promise<{ success: boolean; message: string; data?: MovementResponse }> {
    try {
      // 1. Validar entrada
      this.validateMovementData(request);

      // 2. Procesar movimiento vinculado si existe
      if (request.operate_for) {
        await this.handleLinkedMovement(request);
      }

      // 3. Normalizar datos y crear movimiento
      const movement: Movement = {
        name: request.movement_name.trim(),
        value: request.movement_val,
        date_movement: request.movement_date,
        type_source_id: request.movement_type,
        tag: request.movement_tag?.trim() || '',
        currency: request.currency.toUpperCase(),
        user: request.username.toLowerCase(),
        log: request.operate_for || 0,
      };

      // 4. Crear en base de datos
      const created = await this.repository.create(movement);

      // 5. Mapear a respuesta
      const response: MovementResponse = {
        id: created.id!,
        name: created.name,
        value: created.value,
        date_movement: created.date_movement,
        type_source_id: created.type_source_id,
        tag: created.tag,
        currency: created.currency,
        user: created.user,
      };

      return {
        success: true,
        message: 'Movement created successfully',
        data: response,
      };
    } catch (error) {
      console.error('Error in PutMovementUseCase:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create movement',
      };
    }
  }

  private validateMovementData(request: CreateMovementRequest): void {
    const errors: string[] = [];

    if (!request.movement_name || request.movement_name.trim().length < 2) {
      errors.push('Movement name must be at least 2 characters');
    }

    if (!request.movement_val || request.movement_val === 0) {
      errors.push('Movement value must be different from zero');
    }

    if (!request.movement_date) {
      errors.push('Movement date is required');
    } else if (!this.isValidDate(request.movement_date)) {
      errors.push('Invalid date format');
    }

    if (!request.movement_type) {
      errors.push('Movement type is required');
    } else if (!this.isValidMovementType(request.movement_type)) {
      errors.push('Invalid movement type');
    }

    if (!request.currency) {
      errors.push('Currency is required');
    }

    if (!request.username) {
      errors.push('Username is required');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private isValidMovementType(type: number): boolean {
    return Object.values(MovementType).includes(type);
  }

  private async handleLinkedMovement(request: CreateMovementRequest): Promise<void> {
    if (!request.operate_for) return;

    // Lógica de negocio: actualizar movimiento vinculado
    await this.repository.operateForLinkedMovement(
      request.operate_for,
      request.movement_val,
      request.movement_type,
      request.username
    );
  }
}
