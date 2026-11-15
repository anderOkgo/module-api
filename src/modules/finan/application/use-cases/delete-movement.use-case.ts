import { FinanRepository } from '../ports/finan.repository';
import { originOf, undoOn } from './linked-adjustment';

/**
 * Use case for deleting a financial movement
 * Implements validations and existence verification
 */
export class DeleteMovementUseCase {
  constructor(private readonly repository: FinanRepository) {}

  async execute(id: number, username: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Validate input
      this.validateInput(id, username);

      // 1b. Normalize username the same way create/initial-load do, so this
      // hits the same movements_<username> table regardless of the exact
      // casing stored in the JWT (usernames may contain uppercase letters).
      const normalizedUsername = username.toLowerCase().trim();

      // 2. Verify that the movement exists
      const existing = await this.repository.findById(id, normalizedUsername);
      if (!existing) {
        return {
          success: false,
          message: 'Movement not found',
        };
      }

      // 3. Verify that it belongs to the user
      if (existing.user.toLowerCase() !== normalizedUsername) {
        return {
          success: false,
          message: 'Unauthorized: Movement does not belong to this user',
        };
      }

      // 4. Delete
      // Give its effect back to the origin balance and delete, both or neither (Finanz SPEC v0.10, L.2).
      // An origin that no longer exists is skipped: the movement is still deleted.
      const deleted = await this.repository.runInTransaction(async (tx) => {
        await undoOn(tx, originOf(existing.log), existing.type_source_id, existing.value, normalizedUsername);
        return tx.delete(id, normalizedUsername);
      });

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
