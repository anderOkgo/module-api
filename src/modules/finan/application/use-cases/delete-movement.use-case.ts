import { FinanRepository } from '../ports/finan.repository';

/**
 * Caso de uso para eliminar un movimiento financiero
 * Implementa validaciones y verificación de existencia
 */
export class DeleteMovementUseCase {
  constructor(private readonly repository: FinanRepository) {}

  async execute(id: number, username: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Validar entrada
      this.validateInput(id, username);

      // 2. Verificar que el movimiento existe
      const existing = await this.repository.findById(id, username);
      if (!existing) {
        return {
          success: false,
          message: 'Movement not found',
        };
      }

      // 3. Verificar que pertenece al usuario
      if (existing.user.toLowerCase() !== username.toLowerCase()) {
        return {
          success: false,
          message: 'Unauthorized: Movement does not belong to this user',
        };
      }

      // 4. Eliminar
      const deleted = await this.repository.delete(id, username);

      if (deleted) {
        return {
          success: true,
          message: 'Movement deleted successfully',
        };
      } else {
        return {
          success: false,
          message: 'Failed to delete movement',
        };
      }
    } catch (error) {
      console.error('Error in DeleteMovementUseCase:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete movement',
      };
    }
  }

  private validateInput(id: number, username: string): void {
    const errors: string[] = [];

    if (!id || id <= 0) {
      errors.push('Invalid movement ID');
    }

    if (!username || username.trim().length < 3) {
      errors.push('Valid username is required');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}
