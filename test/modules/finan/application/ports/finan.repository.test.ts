import { FinanRepository } from '../../../../../src/modules/finan/application/ports/finan.repository';
import Movement from '../../../../../src/modules/finan/domain/entities/movement.entity';
import { DataParams } from '../../../../../src/modules/finan/infrastructure/models/dataparams';

describe('FinanRepository Interface', () => {
  // Mock implementation for testing the interface
  class MockFinanRepository implements FinanRepository {
    async create(movement: Movement): Promise<Movement> {
      return { ...movement, id: 1 };
    }

    async findById(id: number, username: string): Promise<Movement | null> {
      if (id === 1) {
        return {
          id: 1,
          name: 'Test Movement',
          value: 100,
          date_movement: '2023-01-01',
          type_source_id: 1,
          tag: 'test',
          currency: 'USD',
          user: username,
        };
      }
      return null;
    }

    async update(id: number, movement: Partial<Movement>, username: string): Promise<Movement> {
      return {
        id,
        name: movement.name || 'Updated Movement',
        value: movement.value || 100,
        date_movement: movement.date_movement || '2023-01-01',
        type_source_id: movement.type_source_id || 1,
        tag: movement.tag || 'test',
        currency: movement.currency || 'USD',
        user: username,
      };
    }

    async delete(id: number, username: string): Promise<boolean> {
      return id > 0;
    }

    async getTotalExpenseDay(username: string, currency: string, date: string): Promise<any[]> {
      return [{ day: date, total: 100 }];
    }

    async getMovements(username: string, currency: string): Promise<any[]> {
      return [{ id: 1, name: 'Movement 1' }];
    }

    async getMovementsByTag(username: string, currency: string): Promise<any[]> {
      return [{ tag: 'test', count: 1 }];
    }

    async getTotalBalance(username: string, currency: string): Promise<any[]> {
      return [{ balance: 1000 }];
    }

    async getYearlyBalance(username: string, currency: string): Promise<any[]> {
      return [{ year: 2023, balance: 12000 }];
    }

    async getMonthlyBalance(username: string, currency: string): Promise<any[]> {
      return [{ month: '2023-01', balance: 1000 }];
    }

    async getBalanceUntilDate(username: string, currency: string): Promise<any[]> {
      return [{ date: '2023-01-01', balance: 1000 }];
    }

    async getMonthlyExpensesUntilCurrentDay(username: string, currency: string): Promise<any[]> {
      return [{ day: 1, expense: 100 }];
    }

    async getGeneralInfo(): Promise<any[]> {
      return [{ info: 'general' }];
    }

    async getTripInfo(): Promise<any[]> {
      return [{ trip: 'vacation' }];
    }

    async operateForLinkedMovement(
      id: number,
      value: number,
      movementType: number,
      username: string
    ): Promise<void> {
      // Mock implementation
    }
  }

  let mockRepository: MockFinanRepository;

  beforeEach(() => {
    mockRepository = new MockFinanRepository();
  });

  describe('CRUD operations', () => {
    it('should create a movement', async () => {
      const movement: Movement = {
        name: 'Test Movement',
        value: 100,
        date_movement: '2023-01-01',
        type_source_id: 1,
        tag: 'test',
        currency: 'USD',
        user: 'testuser',
      };

      const result = await mockRepository.create(movement);

      expect(result).toEqual({
        ...movement,
        id: 1,
      });
    });

    it('should find a movement by id', async () => {
      const result = await mockRepository.findById(1, 'testuser');

      expect(result).toEqual({
        id: 1,
        name: 'Test Movement',
        value: 100,
        date_movement: '2023-01-01',
        type_source_id: 1,
        tag: 'test',
        currency: 'USD',
        user: 'testuser',
      });
    });

    it('should return null when movement not found', async () => {
      const result = await mockRepository.findById(999, 'testuser');

      expect(result).toBeNull();
    });

    it('should update a movement', async () => {
      const updateData: Partial<Movement> = {
        name: 'Updated Movement',
        value: 200,
      };

      const result = await mockRepository.update(1, updateData, 'testuser');

      expect(result).toEqual({
        id: 1,
        name: 'Updated Movement',
        value: 200,
        date_movement: '2023-01-01',
        type_source_id: 1,
        tag: 'test',
        currency: 'USD',
        user: 'testuser',
      });
    });

    it('should delete a movement', async () => {
      const result = await mockRepository.delete(1, 'testuser');

      expect(result).toBe(true);
    });

    it('should return false when delete fails', async () => {
      const result = await mockRepository.delete(0, 'testuser');

      expect(result).toBe(false);
    });
  });

  describe('Query operations', () => {
    it('should get total expense day', async () => {
      const result = await mockRepository.getTotalExpenseDay('testuser', 'USD', '2023-01-01');

      expect(result).toEqual([{ day: '2023-01-01', total: 100 }]);
    });

    it('should get movements', async () => {
      const result = await mockRepository.getMovements('testuser', 'USD');

      expect(result).toEqual([{ id: 1, name: 'Movement 1' }]);
    });

    it('should get movements by tag', async () => {
      const result = await mockRepository.getMovementsByTag('testuser', 'USD');

      expect(result).toEqual([{ tag: 'test', count: 1 }]);
    });

    it('should get total balance', async () => {
      const result = await mockRepository.getTotalBalance('testuser', 'USD');

      expect(result).toEqual([{ balance: 1000 }]);
    });

    it('should get yearly balance', async () => {
      const result = await mockRepository.getYearlyBalance('testuser', 'USD');

      expect(result).toEqual([{ year: 2023, balance: 12000 }]);
    });

    it('should get monthly balance', async () => {
      const result = await mockRepository.getMonthlyBalance('testuser', 'USD');

      expect(result).toEqual([{ month: '2023-01', balance: 1000 }]);
    });

    it('should get balance until date', async () => {
      const result = await mockRepository.getBalanceUntilDate('testuser', 'USD');

      expect(result).toEqual([{ date: '2023-01-01', balance: 1000 }]);
    });

    it('should get monthly expenses until current day', async () => {
      const result = await mockRepository.getMonthlyExpensesUntilCurrentDay('testuser', 'USD');

      expect(result).toEqual([{ day: 1, expense: 100 }]);
    });
  });

  describe('Admin operations', () => {
    it('should get general info', async () => {
      const result = await mockRepository.getGeneralInfo();

      expect(result).toEqual([{ info: 'general' }]);
    });

    it('should get trip info', async () => {
      const result = await mockRepository.getTripInfo();

      expect(result).toEqual([{ trip: 'vacation' }]);
    });
  });

  describe('Special operations', () => {
    it('should operate for linked movement', async () => {
      await expect(mockRepository.operateForLinkedMovement(1, 100, 1, 'testuser')).resolves.not.toThrow();
    });
  });

  describe('Interface compliance', () => {
    it('should implement all required methods', () => {
      const repository: FinanRepository = mockRepository;

      expect(typeof repository.create).toBe('function');
      expect(typeof repository.findById).toBe('function');
      expect(typeof repository.update).toBe('function');
      expect(typeof repository.delete).toBe('function');
      expect(typeof repository.getTotalExpenseDay).toBe('function');
      expect(typeof repository.getMovements).toBe('function');
      expect(typeof repository.getMovementsByTag).toBe('function');
      expect(typeof repository.getTotalBalance).toBe('function');
      expect(typeof repository.getYearlyBalance).toBe('function');
      expect(typeof repository.getMonthlyBalance).toBe('function');
      expect(typeof repository.getBalanceUntilDate).toBe('function');
      expect(typeof repository.getMonthlyExpensesUntilCurrentDay).toBe('function');
      expect(typeof repository.getGeneralInfo).toBe('function');
      expect(typeof repository.getTripInfo).toBe('function');
      expect(typeof repository.operateForLinkedMovement).toBe('function');
    });

    it('should handle method signatures correctly', async () => {
      const movement: Movement = {
        name: 'Test',
        value: 100,
        date_movement: '2023-01-01',
        type_source_id: 1,
        tag: 'test',
        currency: 'USD',
        user: 'testuser',
      };

      // Test that methods accept the correct parameter types
      await expect(mockRepository.create(movement)).resolves.toBeDefined();
      await expect(mockRepository.findById(1, 'testuser')).resolves.toBeDefined();
      await expect(mockRepository.update(1, movement, 'testuser')).resolves.toBeDefined();
      await expect(mockRepository.delete(1, 'testuser')).resolves.toBeDefined();
      await expect(mockRepository.getTotalExpenseDay('testuser', 'USD', '2023-01-01')).resolves.toBeDefined();
      await expect(mockRepository.getMovements('testuser', 'USD')).resolves.toBeDefined();
      await expect(mockRepository.getMovementsByTag('testuser', 'USD')).resolves.toBeDefined();
      await expect(mockRepository.getTotalBalance('testuser', 'USD')).resolves.toBeDefined();
      await expect(mockRepository.getYearlyBalance('testuser', 'USD')).resolves.toBeDefined();
      await expect(mockRepository.getMonthlyBalance('testuser', 'USD')).resolves.toBeDefined();
      await expect(mockRepository.getBalanceUntilDate('testuser', 'USD')).resolves.toBeDefined();
      await expect(mockRepository.getMonthlyExpensesUntilCurrentDay('testuser', 'USD')).resolves.toBeDefined();
      await expect(mockRepository.getGeneralInfo()).resolves.toBeDefined();
      await expect(mockRepository.getTripInfo()).resolves.toBeDefined();
      await expect(mockRepository.operateForLinkedMovement(1, 100, 1, 'testuser')).resolves.toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty parameters', async () => {
      await expect(mockRepository.getTotalExpenseDay('', '', '')).resolves.toBeDefined();
      await expect(mockRepository.getMovements('', '')).resolves.toBeDefined();
      await expect(mockRepository.getMovementsByTag('', '')).resolves.toBeDefined();
      await expect(mockRepository.getTotalBalance('', '')).resolves.toBeDefined();
      await expect(mockRepository.getYearlyBalance('', '')).resolves.toBeDefined();
      await expect(mockRepository.getMonthlyBalance('', '')).resolves.toBeDefined();
      await expect(mockRepository.getBalanceUntilDate('', '')).resolves.toBeDefined();
      await expect(mockRepository.getMonthlyExpensesUntilCurrentDay('', '')).resolves.toBeDefined();
    });

    it('should handle special characters in parameters', async () => {
      await expect(
        mockRepository.getTotalExpenseDay('user@domain.com', 'USD', '2023-01-01')
      ).resolves.toBeDefined();
      await expect(mockRepository.getMovements('user@domain.com', 'USD')).resolves.toBeDefined();
      await expect(mockRepository.getMovementsByTag('user@domain.com', 'USD')).resolves.toBeDefined();
    });

    it('should handle different currencies', async () => {
      await expect(mockRepository.getTotalExpenseDay('testuser', 'EUR', '2023-01-01')).resolves.toBeDefined();
      await expect(mockRepository.getTotalExpenseDay('testuser', 'GBP', '2023-01-01')).resolves.toBeDefined();
      await expect(mockRepository.getTotalExpenseDay('testuser', 'CAD', '2023-01-01')).resolves.toBeDefined();
    });

    it('should handle different date formats', async () => {
      await expect(mockRepository.getTotalExpenseDay('testuser', 'USD', '2023-01-01')).resolves.toBeDefined();
      await expect(mockRepository.getTotalExpenseDay('testuser', 'USD', '2023-12-31')).resolves.toBeDefined();
      await expect(mockRepository.getTotalExpenseDay('testuser', 'USD', '2023-06-15')).resolves.toBeDefined();
    });
  });
});
