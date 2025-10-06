import { FinanRepository } from '../ports/finan.repository';
import Movement, {
  CreateMovementRequest,
  MovementResponse,
  MovementType,
} from '../../domain/entities/movement.entity';

/**
 * Use case for creating a new financial movement
 * Implements business logic for movement creation
 */
export class PutMovementUseCase {
  constructor(private readonly repository: FinanRepository) {}

  async execute(
    request: CreateMovementRequest
  ): Promise<{ success: boolean; message: string; data?: MovementResponse }> {
    try {
      // 1. Validate input
      this.validateMovementData(request);

      // 2. Process linked movement if exists
      if (request.operate_for) {
        await this.handleLinkedMovement(request);
      }

      // 3. Normalize data and create movement
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

      // 4. Create in database
      const created = await this.repository.create(movement);

      // 5. Map to response
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

    // Business logic: update linked movement
    await this.repository.operateForLinkedMovement(
      request.operate_for,
      request.movement_val,
      request.movement_type,
      request.username
    );
  }
}
