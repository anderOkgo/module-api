import { UpdateMovementUseCase } from '../../../../../src/modules/finan/application/use-cases/update-movement.use-case';
import { FinanRepository, FinanTransaction } from '../../../../../src/modules/finan/application/ports/finan.repository';
import {
  UpdateMovementRequest,
  MovementType,
} from '../../../../../src/modules/finan/domain/entities/movement.entity';

// Mock repository
const mockRepository: jest.Mocked<FinanRepository & FinanTransaction> = {
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
  adjustValue: jest.fn(),
  // The transaction gets the same mock: tx.create, tx.update, tx.delete and tx.adjustValue (SPEC v0.10)
  runInTransaction: jest.fn((work: any) => work(mockRepository)),
};

describe('UpdateMovementUseCase', () => {
  let updateMovementUseCase: UpdateMovementUseCase;

  const validRequest: UpdateMovementRequest = {
    movement_name: 'Updated Movement',
    movement_val: 200.75,
    movement_date: '2023-02-01',
    movement_type: MovementType.EXPENSE,
    movement_tag: 'updated-tag',
    currency: 'EUR',
  };

  const existingMovement = {
    id: 1,
    name: 'Original Movement',
    value: 100.5,
    date_movement: '2023-01-01',
    type_source_id: MovementType.INCOME,
    tag: 'original-tag',
    currency: 'USD',
    user: 'testuser',
    log: 0,
  };

  beforeEach(() => {
    updateMovementUseCase = new UpdateMovementUseCase(mockRepository);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update movement successfully', async () => {
      const updatedMovement = {
        ...existingMovement,
        name: 'Updated Movement',
        value: 200.75,
        date_movement: '2023-02-01',
        type_source_id: MovementType.EXPENSE,
        tag: 'updated-tag',
        currency: 'EUR',
        log: 0,
      };

      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.update.mockResolvedValue(updatedMovement);

      const result = await updateMovementUseCase.execute(1, validRequest, 'testuser');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Movement updated successfully');
      expect(result.data).toEqual({
        id: 1,
        name: 'Updated Movement',
        value: 200.75,
        date_movement: '2023-02-01',
        type_source_id: MovementType.EXPENSE,
        tag: 'updated-tag',
        currency: 'EUR',
        user: 'testuser',
      });
      expect(mockRepository.findById).toHaveBeenCalledWith(1, 'testuser');
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        {
          name: 'Updated Movement',
          value: 200.75,
          date_movement: '2023-02-01',
          type_source_id: MovementType.EXPENSE,
          tag: 'updated-tag',
          currency: 'EUR',
          log: 0,
        },
        'testuser'
      );
    });

    it('normalizes a mixed-case username to lowercase before hitting the repository (regression: registration allows uppercase usernames, but create()/initial-load already lowercase before touching movements_<user> - update must match or it looks in a different, nonexistent table and reports "Movement not found")', async () => {
      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.update.mockResolvedValue({ ...existingMovement, ...validRequest, log: 0 });

      const result = await updateMovementUseCase.execute(1, validRequest, 'TestUser');

      expect(result.success).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith(1, 'testuser');
      expect(mockRepository.update).toHaveBeenCalledWith(1, expect.any(Object), 'testuser');
    });

    it('should handle linked movement when operate_for is provided', async () => {
      const requestWithLinked: UpdateMovementRequest = {
        ...validRequest,
        operate_for: 456,
      };

      const updatedMovement = {
        ...existingMovement,
        name: 'Updated Movement',
        value: 200.75,
        date_movement: '2023-02-01',
        type_source_id: MovementType.EXPENSE,
        tag: 'updated-tag',
        currency: 'EUR',
        log: 456,
      };

      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.adjustValue.mockResolvedValue(true);
      mockRepository.update.mockResolvedValue(updatedMovement);

      const result = await updateMovementUseCase.execute(1, requestWithLinked, 'testuser');

      expect(result.success).toBe(true);
      // The new expense takes its value from the new origin (SPEC v0.10); the old movement had no origin
      expect(mockRepository.adjustValue).toHaveBeenCalledTimes(1);
      expect(mockRepository.adjustValue).toHaveBeenCalledWith(456, -200.75, 'testuser');
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        {
          name: 'Updated Movement',
          value: 200.75,
          date_movement: '2023-02-01',
          type_source_id: MovementType.EXPENSE,
          tag: 'updated-tag',
          currency: 'EUR',
          log: 456,
        },
        'testuser'
      );
    });

    describe('re-adjusting the origin (Finanz SPEC v0.10, L.2)', () => {
      // An expense of 50 taken from origin 7
      const expense = { ...existingMovement, value: 50, type_source_id: MovementType.EXPENSE, log: 7 };
      const edit = (changes: Partial<UpdateMovementRequest>) =>
        updateMovementUseCase.execute(
          1,
          { ...validRequest, movement_val: 50, movement_type: MovementType.EXPENSE, operate_for: 7, ...changes },
          'testuser'
        );

      beforeEach(() => {
        mockRepository.findById.mockResolvedValue(expense);
        mockRepository.adjustValue.mockResolvedValue(true);
        mockRepository.update.mockResolvedValue(expense);
      });

      it('J4: a new value gives the old one back and takes the new one', async () => {
        expect((await edit({ movement_val: 80 })).success).toBe(true);
        expect(mockRepository.adjustValue.mock.calls).toEqual([
          [7, 50, 'testuser'],
          [7, -80, 'testuser'],
        ]);
      });

      it('J5: an expense turned into an income gives 50 back and adds 50', async () => {
        await edit({ movement_type: MovementType.INCOME });
        expect(mockRepository.adjustValue.mock.calls).toEqual([
          [7, 50, 'testuser'],
          [7, 50, 'testuser'],
        ]);
      });

      it('J6: a new origin: the old one gets 50 back, the new one loses 50', async () => {
        await edit({ operate_for: 9 });
        expect(mockRepository.adjustValue.mock.calls).toEqual([
          [7, 50, 'testuser'],
          [9, -50, 'testuser'],
        ]);
      });

      it('J7: no origin any more: only the old one gets 50 back', async () => {
        await edit({ operate_for: undefined });
        expect(mockRepository.adjustValue.mock.calls).toEqual([[7, 50, 'testuser']]);
        expect(mockRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({ log: 0 }), 'testuser');
      });

      it('J8: a new origin that does not exist is refused, and nothing is written', async () => {
        mockRepository.adjustValue.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

        expect(await edit({ operate_for: 999 })).toEqual({ success: false, message: 'Linked movement not found' });
        expect(mockRepository.update).not.toHaveBeenCalled();
        // The undo already done rolls back with the transaction, which ends in that error
        await expect(mockRepository.runInTransaction.mock.results[0].value).rejects.toThrow('Linked movement not found');
      });

      it('an old origin that no longer exists is skipped', async () => {
        mockRepository.adjustValue.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        expect((await edit({})).success).toBe(true);
        expect(mockRepository.update).toHaveBeenCalled();
      });

      it('reads a stored value that comes back as text, and a NULL origin as none', async () => {
        mockRepository.findById.mockResolvedValue({ ...expense, value: '50.00' as any, log: null as any });
        await edit({});
        expect(mockRepository.adjustValue.mock.calls).toEqual([[7, -50, 'testuser']]);
      });
    });

    it('should normalize data correctly', async () => {
      const requestWithSpaces: UpdateMovementRequest = {
        movement_name: '  Updated Movement  ',
        movement_val: 200.75,
        movement_date: '2023-02-01',
        movement_type: MovementType.EXPENSE,
        movement_tag: '  updated-tag  ',
        currency: 'eur',
      };

      const updatedMovement = {
        ...existingMovement,
        name: 'Updated Movement',
        value: 200.75,
        date_movement: '2023-02-01',
        type_source_id: MovementType.EXPENSE,
        tag: 'updated-tag',
        currency: 'EUR',
        log: 0,
      };

      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.update.mockResolvedValue(updatedMovement);

      await updateMovementUseCase.execute(1, requestWithSpaces, 'testuser');

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        {
          name: 'Updated Movement', // Trimmed
          value: 200.75,
          date_movement: '2023-02-01',
          type_source_id: MovementType.EXPENSE,
          tag: 'updated-tag', // Trimmed
          currency: 'EUR', // Uppercase
          log: 0,
        },
        'testuser'
      );
    });

    it('should handle empty tag by setting to empty string', async () => {
      const requestWithoutTag: UpdateMovementRequest = {
        ...validRequest,
        movement_tag: undefined as any,
      };

      const updatedMovement = {
        ...existingMovement,
        name: 'Updated Movement',
        value: 200.75,
        date_movement: '2023-02-01',
        type_source_id: MovementType.EXPENSE,
        tag: '',
        currency: 'EUR',
        log: 0,
      };

      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.update.mockResolvedValue(updatedMovement);

      await updateMovementUseCase.execute(1, requestWithoutTag, 'testuser');

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        {
          name: 'Updated Movement',
          value: 200.75,
          date_movement: '2023-02-01',
          type_source_id: MovementType.EXPENSE,
          tag: '',
          currency: 'EUR',
          log: 0,
        },
        'testuser'
      );
    });

    it('should return error when movement is not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await updateMovementUseCase.execute(1, validRequest, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Movement not found');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should return error when id is invalid', async () => {
      const result = await updateMovementUseCase.execute(0, validRequest, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid movement ID');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error when id is negative', async () => {
      const result = await updateMovementUseCase.execute(-1, validRequest, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid movement ID');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error when username is missing', async () => {
      const result = await updateMovementUseCase.execute(1, validRequest, '');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Valid username is required');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error when username is too short', async () => {
      const result = await updateMovementUseCase.execute(1, validRequest, 'ab');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Valid username is required');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error when movement_name is missing', async () => {
      const invalidRequest: UpdateMovementRequest = {
        ...validRequest,
        movement_name: '',
      };

      const result = await updateMovementUseCase.execute(1, invalidRequest, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Movement name must be at least 2 characters');
    });

    it('should return error when movement_name is too short', async () => {
      const invalidRequest: UpdateMovementRequest = {
        ...validRequest,
        movement_name: 'a',
      };

      const result = await updateMovementUseCase.execute(1, invalidRequest, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Movement name must be at least 2 characters');
    });

    it('should return error when movement_val is zero', async () => {
      const invalidRequest: UpdateMovementRequest = {
        ...validRequest,
        movement_val: 0,
      };

      const result = await updateMovementUseCase.execute(1, invalidRequest, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Movement value must be different from zero');
    });

    it('should return error when movement_val is undefined', async () => {
      const invalidRequest: UpdateMovementRequest = {
        ...validRequest,
        movement_val: undefined as any,
      };

      const result = await updateMovementUseCase.execute(1, invalidRequest, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Movement value must be different from zero');
    });

    it('should return error when movement_date is missing', async () => {
      const invalidRequest: UpdateMovementRequest = {
        ...validRequest,
        movement_date: '',
      };

      const result = await updateMovementUseCase.execute(1, invalidRequest, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Movement date is required');
    });

    it('should return error when movement_type is missing', async () => {
      const invalidRequest: UpdateMovementRequest = {
        ...validRequest,
        movement_type: undefined as any,
      };

      const result = await updateMovementUseCase.execute(1, invalidRequest, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Movement type is required');
    });

    it('should reject a movement type that does not exist, as creating does', async () => {
      const result = await updateMovementUseCase.execute(
        1,
        { ...validRequest, movement_type: 3 as any },
        'testuser'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid movement type');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should return error when currency is missing', async () => {
      const invalidRequest: UpdateMovementRequest = {
        ...validRequest,
        currency: '',
      };

      const result = await updateMovementUseCase.execute(1, invalidRequest, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Currency is required');
    });

    it('should return error with multiple validation errors', async () => {
      const invalidRequest: UpdateMovementRequest = {
        movement_name: '',
        movement_val: 0,
        movement_date: '',
        movement_type: undefined as any,
        movement_tag: '',
        currency: '',
      };

      const result = await updateMovementUseCase.execute(0, invalidRequest, '');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid movement ID');
      expect(result.message).toContain('Valid username is required');
      expect(result.message).toContain('Movement name must be at least 2 characters');
      expect(result.message).toContain('Movement value must be different from zero');
      expect(result.message).toContain('Movement date is required');
      expect(result.message).toContain('Movement type is required');
      expect(result.message).toContain('Currency is required');
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      const result = await updateMovementUseCase.execute(1, validRequest, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database connection failed');
    });

    it('should handle update repository errors gracefully', async () => {
      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.update.mockRejectedValue(new Error('Update failed'));

      const result = await updateMovementUseCase.execute(1, validRequest, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Update failed');
    });

    it('should handle unknown errors gracefully', async () => {
      mockRepository.findById.mockRejectedValue('Unknown error');

      const result = await updateMovementUseCase.execute(1, validRequest, 'testuser');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to update movement');
    });
  });

  describe('Edge cases', () => {
    it('should handle negative movement values', async () => {
      const requestWithNegative: UpdateMovementRequest = {
        ...validRequest,
        movement_val: -200.75,
      };

      const updatedMovement = {
        ...existingMovement,
        name: 'Updated Movement',
        value: -200.75,
        date_movement: '2023-02-01',
        type_source_id: MovementType.EXPENSE,
        tag: 'updated-tag',
        currency: 'EUR',
        log: 0,
      };

      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.update.mockResolvedValue(updatedMovement);

      const result = await updateMovementUseCase.execute(1, requestWithNegative, 'testuser');

      expect(result.success).toBe(true);
      expect(result.data?.value).toBe(-200.75);
    });

    it('should handle large movement values', async () => {
      const requestWithLargeValue: UpdateMovementRequest = {
        ...validRequest,
        movement_val: 999999999.99,
      };

      const updatedMovement = {
        ...existingMovement,
        name: 'Updated Movement',
        value: 999999999.99,
        date_movement: '2023-02-01',
        type_source_id: MovementType.EXPENSE,
        tag: 'updated-tag',
        currency: 'EUR',
        log: 0,
      };

      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.update.mockResolvedValue(updatedMovement);

      const result = await updateMovementUseCase.execute(1, requestWithLargeValue, 'testuser');

      expect(result.success).toBe(true);
      expect(result.data?.value).toBe(999999999.99);
    });

    it('should handle different movement types', async () => {
      const incomeRequest: UpdateMovementRequest = {
        ...validRequest,
        movement_type: MovementType.INCOME,
      };

      const expenseRequest: UpdateMovementRequest = {
        ...validRequest,
        movement_type: MovementType.EXPENSE,
      };

      const transferRequest: UpdateMovementRequest = {
        ...validRequest,
        movement_type: MovementType.TRANSFER,
      };

      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.update.mockResolvedValue({
        ...existingMovement,
        name: 'Updated Movement',
        value: 200.75,
        date_movement: '2023-02-01',
        type_source_id: MovementType.INCOME,
        tag: 'updated-tag',
        currency: 'EUR',
        log: 0,
      });

      const incomeResult = await updateMovementUseCase.execute(1, incomeRequest, 'testuser');
      const expenseResult = await updateMovementUseCase.execute(1, expenseRequest, 'testuser');
      const transferResult = await updateMovementUseCase.execute(1, transferRequest, 'testuser');

      expect(incomeResult.success).toBe(true);
      expect(expenseResult.success).toBe(true);
      expect(transferResult.success).toBe(true);
    });

    it('should handle special characters in movement name and tag', async () => {
      const requestWithSpecialChars: UpdateMovementRequest = {
        ...validRequest,
        movement_name: 'Updated Movement with Special!@#$%^&*()_+ Characters',
        movement_tag: 'updated-tag-with-dashes_and_underscores',
      };

      const updatedMovement = {
        ...existingMovement,
        name: 'Updated Movement with Special!@#$%^&*()_+ Characters',
        value: 200.75,
        date_movement: '2023-02-01',
        type_source_id: MovementType.EXPENSE,
        tag: 'updated-tag-with-dashes_and_underscores',
        currency: 'EUR',
        log: 0,
      };

      mockRepository.findById.mockResolvedValue(existingMovement);
      mockRepository.update.mockResolvedValue(updatedMovement);

      const result = await updateMovementUseCase.execute(1, requestWithSpecialChars, 'testuser');

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Movement with Special!@#$%^&*()_+ Characters');
      expect(result.data?.tag).toBe('updated-tag-with-dashes_and_underscores');
    });

    it('should handle whitespace-only username', async () => {
      const result = await updateMovementUseCase.execute(1, validRequest, '   ');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Valid username is required');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });
  });
});
