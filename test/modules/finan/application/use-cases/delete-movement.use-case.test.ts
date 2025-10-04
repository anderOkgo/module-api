import { DeleteMovementUseCase } from '../../../../../src/modules/finan/application/use-cases/delete-movement.use-case';
import { FinanRepository } from '../../../../../src/modules/finan/application/ports/finan.repository';
import { MovementType } from '../../../../../src/modules/finan/domain/entities/movement.entity';

// Mock repository
const mockRepository: jest.Mocked<FinanRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getTotalExpenseDay: jest.fn(),
  getMovements: jest.fn(),
  getMovementsByTag: jest.fn(),
  getTotalBalance: jest.fn(),
  getYearlyBalance: jest.fn(),
  getMonthlyBalance: jest.fn(),
  getBalanceUntilDate: jest.fn(),
  getMonthlyExpensesUntilCurrentDay: jest.fn(),
  getGeneralInfo: jest.fn(),
  getTripInfo: jest.fn(),
  operateForLinkedMovement: jest.fn(),
};

describe('DeleteMovementUseCase', () => {
  let deleteMovementUseCase: DeleteMovementUseCase;

  const existingMovement = {
    id: 1,
    name: 'Test Movement',
    value: 100.5,
    date_movement: '2023-01-01',
    type_source_id: MovementType.INCOME,
    tag: 'test-tag',
    currency: 'USD',
    user: 'testuser',
    log: 0,
  };

  beforeEach(() => {
    deleteMovementUseCase = new DeleteMovementUseCase(mockRepository);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete movement successfully', async () => {
      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.delete.mockResolvedValue(true);

      const result = await deleteMovementUseCase.execute(1, 'testuser');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Movement deleted successfully');
      expect(mockRepository.findById).toHaveBeenCalledWith(1, 'testuser');
      expect(mockRepository.delete).toHaveBeenCalledWith(1, 'testuser');
    });

    it('should handle case-insensitive username comparison', async () => {
      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.delete.mockResolvedValue(true);

      const result = await deleteMovementUseCase.execute(1, 'TESTUSER');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Movement deleted successfully');
      expect(mockRepository.findById).toHaveBeenCalledWith(1, 'TESTUSER');
      expect(mockRepository.delete).toHaveBeenCalledWith(1, 'TESTUSER');
    });

    it('should return error when movement is not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await deleteMovementUseCase.execute(1, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Movement not found');
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should return error when movement does not belong to user', async () => {
      const differentUserMovement = {
        ...existingMovement,
        user: 'differentuser',
      };

      mockRepository.findById.mockResolvedValue(differentUserMovement);

      const result = await deleteMovementUseCase.execute(1, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized: Movement does not belong to this user');
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should return error when delete operation fails', async () => {
      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.delete.mockResolvedValue(false);

      const result = await deleteMovementUseCase.execute(1, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to delete movement');
      expect(mockRepository.findById).toHaveBeenCalledWith(1, 'testuser');
      expect(mockRepository.delete).toHaveBeenCalledWith(1, 'testuser');
    });

    it('should return error when id is invalid', async () => {
      const result = await deleteMovementUseCase.execute(0, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid movement ID');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error when id is negative', async () => {
      const result = await deleteMovementUseCase.execute(-1, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid movement ID');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error when username is missing', async () => {
      const result = await deleteMovementUseCase.execute(1, '');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Valid username is required');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error when username is too short', async () => {
      const result = await deleteMovementUseCase.execute(1, 'ab');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Valid username is required');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error when username is only whitespace', async () => {
      const result = await deleteMovementUseCase.execute(1, '   ');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Valid username is required');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error with multiple validation errors', async () => {
      const result = await deleteMovementUseCase.execute(0, '');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid movement ID');
      expect(result.message).toContain('Valid username is required');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      const result = await deleteMovementUseCase.execute(1, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database connection failed');
    });

    it('should handle delete repository errors gracefully', async () => {
      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.delete.mockRejectedValue(new Error('Delete operation failed'));

      const result = await deleteMovementUseCase.execute(1, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Delete operation failed');
    });

    it('should handle unknown errors gracefully', async () => {
      mockRepository.findById.mockRejectedValue('Unknown error');

      const result = await deleteMovementUseCase.execute(1, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to delete movement');
    });
  });

  describe('Edge cases', () => {
    it('should handle large movement IDs', async () => {
      const largeIdMovement = {
        ...existingMovement,
        id: 999999999,
      };

      mockRepository.findById.mockResolvedValue(largeIdMovement);
      mockRepository.delete.mockResolvedValue(true);

      const result = await deleteMovementUseCase.execute(999999999, 'testuser');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Movement deleted successfully');
      expect(mockRepository.findById).toHaveBeenCalledWith(999999999, 'testuser');
      expect(mockRepository.delete).toHaveBeenCalledWith(999999999, 'testuser');
    });

    it('should handle special characters in username', async () => {
      const specialUserMovement = {
        ...existingMovement,
        user: 'user@domain.com',
      };

      mockRepository.findById.mockResolvedValue(specialUserMovement);
      mockRepository.delete.mockResolvedValue(true);

      const result = await deleteMovementUseCase.execute(1, 'user@domain.com');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Movement deleted successfully');
      expect(mockRepository.findById).toHaveBeenCalledWith(1, 'user@domain.com');
      expect(mockRepository.delete).toHaveBeenCalledWith(1, 'user@domain.com');
    });

    it('should handle unicode characters in username', async () => {
      const unicodeUserMovement = {
        ...existingMovement,
        user: 'usuario-español',
      };

      mockRepository.findById.mockResolvedValue(unicodeUserMovement);
      mockRepository.delete.mockResolvedValue(true);

      const result = await deleteMovementUseCase.execute(1, 'usuario-español');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Movement deleted successfully');
      expect(mockRepository.findById).toHaveBeenCalledWith(1, 'usuario-español');
      expect(mockRepository.delete).toHaveBeenCalledWith(1, 'usuario-español');
    });

    it('should handle different movement types for ownership check', async () => {
      const incomeMovement = {
        ...existingMovement,
        type_source_id: MovementType.INCOME,
      };

      const expenseMovement = {
        ...existingMovement,
        type_source_id: MovementType.EXPENSE,
      };

      const transferMovement = {
        ...existingMovement,
        type_source_id: MovementType.TRANSFER,
      };

      mockRepository.findById
        .mockResolvedValueOnce(incomeMovement)
        .mockResolvedValueOnce(expenseMovement)
        .mockResolvedValueOnce(transferMovement);
      mockRepository.delete.mockResolvedValue(true);

      const incomeResult = await deleteMovementUseCase.execute(1, 'testuser');
      const expenseResult = await deleteMovementUseCase.execute(2, 'testuser');
      const transferResult = await deleteMovementUseCase.execute(3, 'testuser');

      expect(incomeResult.success).toBe(true);
      expect(expenseResult.success).toBe(true);
      expect(transferResult.success).toBe(true);
    });

    it('should handle null and undefined inputs gracefully', async () => {
      const nullIdResult = await deleteMovementUseCase.execute(null as any, 'testuser');
      const undefinedIdResult = await deleteMovementUseCase.execute(undefined as any, 'testuser');
      const nullUsernameResult = await deleteMovementUseCase.execute(1, null as any);
      const undefinedUsernameResult = await deleteMovementUseCase.execute(1, undefined as any);

      expect(nullIdResult.success).toBe(false);
      expect(nullIdResult.message).toContain('Invalid movement ID');

      expect(undefinedIdResult.success).toBe(false);
      expect(undefinedIdResult.message).toContain('Invalid movement ID');

      expect(nullUsernameResult.success).toBe(false);
      expect(nullUsernameResult.message).toContain('Valid username is required');

      expect(undefinedUsernameResult.success).toBe(false);
      expect(undefinedUsernameResult.message).toContain('Valid username is required');
    });

    it('should handle case sensitivity in username ownership check', async () => {
      const upperCaseMovement = {
        ...existingMovement,
        user: 'TESTUSER',
      };

      mockRepository.findById.mockResolvedValue(upperCaseMovement);
      mockRepository.delete.mockResolvedValue(true);

      const result = await deleteMovementUseCase.execute(1, 'testuser');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Movement deleted successfully');
    });

    it('should handle mixed case username ownership check', async () => {
      const mixedCaseMovement = {
        ...existingMovement,
        user: 'TestUser',
      };

      mockRepository.findById.mockResolvedValue(mixedCaseMovement);
      mockRepository.delete.mockResolvedValue(true);

      const result = await deleteMovementUseCase.execute(1, 'testuser');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Movement deleted successfully');
    });
  });
});
