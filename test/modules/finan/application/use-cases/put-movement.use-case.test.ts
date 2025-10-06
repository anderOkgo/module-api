import { PutMovementUseCase } from '../../../../../src/modules/finan/application/use-cases/put-movement.use-case';
import { FinanRepository } from '../../../../../src/modules/finan/application/ports/finan.repository';
import {
  CreateMovementRequest,
  MovementType,
} from '../../../../../src/modules/finan/domain/entities/movement.entity';

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

describe('PutMovementUseCase', () => {
  let putMovementUseCase: PutMovementUseCase;

  const validRequest: CreateMovementRequest = {
    movement_name: 'Test Movement',
    movement_val: 100.5,
    movement_date: '2023-01-01',
    movement_type: MovementType.INCOME,
    movement_tag: 'test-tag',
    currency: 'USD',
    username: 'testuser',
  };

  beforeEach(() => {
    putMovementUseCase = new PutMovementUseCase(mockRepository);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create movement successfully', async () => {
      const createdMovement = {
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

      mockRepository.create.mockResolvedValue(createdMovement);

      const result = await putMovementUseCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Movement created successfully');
      expect(result.data).toEqual({
        id: 1,
        name: 'Test Movement',
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: 'test-tag',
        currency: 'USD',
        user: 'testuser',
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Test Movement',
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: 'test-tag',
        currency: 'USD',
        user: 'testuser',
        log: 0,
      });
    });

    it('should handle linked movement when operate_for is provided', async () => {
      const requestWithLinked: CreateMovementRequest = {
        ...validRequest,
        operate_for: 123,
      };

      const createdMovement = {
        id: 2,
        name: 'Test Movement',
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: 'test-tag',
        currency: 'USD',
        user: 'testuser',
        log: 123,
      };

      mockRepository.operateForLinkedMovement.mockResolvedValue();
      mockRepository.create.mockResolvedValue(createdMovement);

      const result = await putMovementUseCase.execute(requestWithLinked);

      expect(result.success).toBe(true);
      expect(mockRepository.operateForLinkedMovement).toHaveBeenCalledWith(
        123,
        100.5,
        MovementType.INCOME,
        'testuser'
      );
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Test Movement',
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: 'test-tag',
        currency: 'USD',
        user: 'testuser',
        log: 123,
      });
    });

    it('should normalize data correctly', async () => {
      const requestWithSpaces: CreateMovementRequest = {
        movement_name: '  Test Movement  ',
        movement_val: 100.5,
        movement_date: '2023-01-01',
        movement_type: MovementType.INCOME,
        movement_tag: '  test-tag  ',
        currency: 'usd',
        username: 'TESTUSER',
      };

      const createdMovement = {
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

      mockRepository.create.mockResolvedValue(createdMovement);

      await putMovementUseCase.execute(requestWithSpaces);

      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Test Movement', // Trimmed
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: 'test-tag', // Trimmed
        currency: 'USD', // Uppercase
        user: 'testuser', // Lowercase
        log: 0,
      });
    });

    it('should handle empty tag by setting to empty string', async () => {
      const requestWithoutTag: CreateMovementRequest = {
        ...validRequest,
        movement_tag: undefined as any,
      };

      const createdMovement = {
        id: 1,
        name: 'Test Movement',
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: '',
        currency: 'USD',
        user: 'testuser',
        log: 0,
      };

      mockRepository.create.mockResolvedValue(createdMovement);

      await putMovementUseCase.execute(requestWithoutTag);

      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Test Movement',
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: '',
        currency: 'USD',
        user: 'testuser',
        log: 0,
      });
    });

    it('should return error when movement_name is missing', async () => {
      const invalidRequest: CreateMovementRequest = {
        ...validRequest,
        movement_name: '',
      };

      const result = await putMovementUseCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Movement name must be at least 2 characters');
    });

    it('should return error when movement_name is too short', async () => {
      const invalidRequest: CreateMovementRequest = {
        ...validRequest,
        movement_name: 'a',
      };

      const result = await putMovementUseCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Movement name must be at least 2 characters');
    });

    it('should return error when movement_val is zero', async () => {
      const invalidRequest: CreateMovementRequest = {
        ...validRequest,
        movement_val: 0,
      };

      const result = await putMovementUseCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Movement value must be different from zero');
    });

    it('should return error when movement_val is undefined', async () => {
      const invalidRequest: CreateMovementRequest = {
        ...validRequest,
        movement_val: undefined as any,
      };

      const result = await putMovementUseCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Movement value must be different from zero');
    });

    it('should return error when movement_date is missing', async () => {
      const invalidRequest: CreateMovementRequest = {
        ...validRequest,
        movement_date: '',
      };

      const result = await putMovementUseCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Movement date is required');
    });

    it('should return error when movement_date is invalid', async () => {
      const invalidRequest: CreateMovementRequest = {
        ...validRequest,
        movement_date: 'invalid-date',
      };

      const result = await putMovementUseCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid date format');
    });

    it('should return error when movement_type is invalid', async () => {
      const invalidRequest: CreateMovementRequest = {
        ...validRequest,
        movement_type: 999, // Invalid type
      };

      const result = await putMovementUseCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid movement type');
    });

    it('should return error when currency is missing', async () => {
      const invalidRequest: CreateMovementRequest = {
        ...validRequest,
        currency: '',
      };

      const result = await putMovementUseCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Currency is required');
    });

    it('should return error when username is missing', async () => {
      const invalidRequest: CreateMovementRequest = {
        ...validRequest,
        username: '',
      };

      const result = await putMovementUseCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Username is required');
    });

    it('should return error with multiple validation errors', async () => {
      const invalidRequest: CreateMovementRequest = {
        movement_name: '',
        movement_val: 0,
        movement_date: '',
        movement_type: 999,
        movement_tag: '',
        currency: '',
        username: '',
      };

      const result = await putMovementUseCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Movement name must be at least 2 characters');
      expect(result.message).toContain('Movement value must be different from zero');
      expect(result.message).toContain('Movement date is required');
      expect(result.message).toContain('Invalid movement type');
      expect(result.message).toContain('Currency is required');
      expect(result.message).toContain('Username is required');
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.create.mockRejectedValue(new Error('Database connection failed'));

      const result = await putMovementUseCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database connection failed');
    });

    it('should handle unknown errors gracefully', async () => {
      mockRepository.create.mockRejectedValue('Unknown error');

      const result = await putMovementUseCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to create movement');
    });

    it('should handle linked movement errors gracefully', async () => {
      const requestWithLinked: CreateMovementRequest = {
        ...validRequest,
        operate_for: 123,
      };

      mockRepository.operateForLinkedMovement.mockRejectedValue(new Error('Linked movement operation failed'));

      const result = await putMovementUseCase.execute(requestWithLinked);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Linked movement operation failed');
    });
  });

  describe('Edge cases', () => {
    it('should handle negative movement values', async () => {
      const requestWithNegative: CreateMovementRequest = {
        ...validRequest,
        movement_val: -100.5,
      };

      const createdMovement = {
        id: 1,
        name: 'Test Movement',
        value: -100.5,
        date_movement: '2023-01-01',
        type_source_id: MovementType.EXPENSE,
        tag: 'test-tag',
        currency: 'USD',
        user: 'testuser',
        log: 0,
      };

      mockRepository.create.mockResolvedValue(createdMovement);

      const result = await putMovementUseCase.execute(requestWithNegative);

      expect(result.success).toBe(true);
      expect(result.data?.value).toBe(-100.5);
    });

    it('should handle large movement values', async () => {
      const requestWithLargeValue: CreateMovementRequest = {
        ...validRequest,
        movement_val: 999999999.99,
      };

      const createdMovement = {
        id: 1,
        name: 'Test Movement',
        value: 999999999.99,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: 'test-tag',
        currency: 'USD',
        user: 'testuser',
        log: 0,
      };

      mockRepository.create.mockResolvedValue(createdMovement);

      const result = await putMovementUseCase.execute(requestWithLargeValue);

      expect(result.success).toBe(true);
      expect(result.data?.value).toBe(999999999.99);
    });

    it('should handle different movement types', async () => {
      const incomeRequest: CreateMovementRequest = {
        ...validRequest,
        movement_type: MovementType.INCOME,
      };

      const expenseRequest: CreateMovementRequest = {
        ...validRequest,
        movement_type: MovementType.EXPENSE,
      };

      const transferRequest: CreateMovementRequest = {
        ...validRequest,
        movement_type: MovementType.TRANSFER,
      };

      mockRepository.create.mockResolvedValue({
        id: 1,
        name: 'Test Movement',
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: 'test-tag',
        currency: 'USD',
        user: 'testuser',
        log: 0,
      });

      const incomeResult = await putMovementUseCase.execute(incomeRequest);
      const expenseResult = await putMovementUseCase.execute(expenseRequest);
      const transferResult = await putMovementUseCase.execute(transferRequest);

      expect(incomeResult.success).toBe(true);
      expect(expenseResult.success).toBe(true);
      expect(transferResult.success).toBe(true);
    });

    it('should handle special characters in movement name and tag', async () => {
      const requestWithSpecialChars: CreateMovementRequest = {
        ...validRequest,
        movement_name: 'Movement with Special!@#$%^&*()_+ Characters',
        movement_tag: 'tag-with-dashes_and_underscores',
      };

      const createdMovement = {
        id: 1,
        name: 'Movement with Special!@#$%^&*()_+ Characters',
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: 'tag-with-dashes_and_underscores',
        currency: 'USD',
        user: 'testuser',
        log: 0,
      };

      mockRepository.create.mockResolvedValue(createdMovement);

      const result = await putMovementUseCase.execute(requestWithSpecialChars);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Movement with Special!@#$%^&*()_+ Characters');
      expect(result.data?.tag).toBe('tag-with-dashes_and_underscores');
    });
  });
});
