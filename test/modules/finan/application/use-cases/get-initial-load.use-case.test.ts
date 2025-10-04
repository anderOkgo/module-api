import { GetInitialLoadUseCase } from '../../../../../src/modules/finan/application/use-cases/get-initial-load.use-case';
import { FinanRepository } from '../../../../../src/modules/finan/application/ports/finan.repository';
import { InitialLoadRequest } from '../../../../../src/modules/finan/domain/entities/movement-request.entity';
import { InitialLoadResponse } from '../../../../../src/modules/finan/domain/entities/movement.entity';

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

describe('GetInitialLoadUseCase', () => {
  let getInitialLoadUseCase: GetInitialLoadUseCase;

  beforeEach(() => {
    getInitialLoadUseCase = new GetInitialLoadUseCase(mockRepository);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockInitialLoadResponse: InitialLoadResponse = {
      totalExpenseDay: [{ day: '2023-01-01', total: 100 }],
      movements: [{ id: 1, name: 'Test Movement' }],
      movementTag: [{ tag: 'test', count: 1 }],
      totalBalance: [{ balance: 1000 }],
      yearlyBalance: [{ year: 2023, balance: 12000 }],
      monthlyBalance: [{ month: '2023-01', balance: 1000 }],
      balanceUntilDate: [{ date: '2023-01-01', balance: 1000 }],
      monthlyExpensesUntilDay: [{ day: 1, expense: 100 }],
    };

    it('should execute successfully with all required data', async () => {
      const request: InitialLoadRequest = {
        username: 'testuser',
        currency: 'USD',
        date: '2023-01-01',
      };

      // Mock all repository methods
      mockRepository.getTotalExpenseDay.mockResolvedValue(mockInitialLoadResponse.totalExpenseDay);
      mockRepository.getMovements.mockResolvedValue(mockInitialLoadResponse.movements);
      mockRepository.getMovementsByTag.mockResolvedValue(mockInitialLoadResponse.movementTag);
      mockRepository.getTotalBalance.mockResolvedValue(mockInitialLoadResponse.totalBalance);
      mockRepository.getYearlyBalance.mockResolvedValue(mockInitialLoadResponse.yearlyBalance);
      mockRepository.getMonthlyBalance.mockResolvedValue(mockInitialLoadResponse.monthlyBalance);
      mockRepository.getBalanceUntilDate.mockResolvedValue(mockInitialLoadResponse.balanceUntilDate);
      mockRepository.getMonthlyExpensesUntilCurrentDay.mockResolvedValue(
        mockInitialLoadResponse.monthlyExpensesUntilDay
      );

      const result = await getInitialLoadUseCase.execute(request);

      expect(result).toEqual(mockInitialLoadResponse);
      expect(mockRepository.getTotalExpenseDay).toHaveBeenCalledWith('testuser', 'USD', '2023-01-01');
      expect(mockRepository.getMovements).toHaveBeenCalledWith('testuser', 'USD');
      expect(mockRepository.getMovementsByTag).toHaveBeenCalledWith('testuser', 'USD');
      expect(mockRepository.getTotalBalance).toHaveBeenCalledWith('testuser', 'USD');
      expect(mockRepository.getYearlyBalance).toHaveBeenCalledWith('testuser', 'USD');
      expect(mockRepository.getMonthlyBalance).toHaveBeenCalledWith('testuser', 'USD');
      expect(mockRepository.getBalanceUntilDate).toHaveBeenCalledWith('testuser', 'USD');
      expect(mockRepository.getMonthlyExpensesUntilCurrentDay).toHaveBeenCalledWith('testuser', 'USD');
    });

    it('should use start_date when date is not provided', async () => {
      const request: InitialLoadRequest = {
        username: 'testuser',
        currency: 'USD',
        start_date: '2023-06-01',
      };

      mockRepository.getTotalExpenseDay.mockResolvedValue([]);
      mockRepository.getMovements.mockResolvedValue([]);
      mockRepository.getMovementsByTag.mockResolvedValue([]);
      mockRepository.getTotalBalance.mockResolvedValue([]);
      mockRepository.getYearlyBalance.mockResolvedValue([]);
      mockRepository.getMonthlyBalance.mockResolvedValue([]);
      mockRepository.getBalanceUntilDate.mockResolvedValue([]);
      mockRepository.getMonthlyExpensesUntilCurrentDay.mockResolvedValue([]);

      await getInitialLoadUseCase.execute(request);

      expect(mockRepository.getTotalExpenseDay).toHaveBeenCalledWith('testuser', 'USD', '2023-06-01');
    });

    it('should use current date when neither date nor start_date provided', async () => {
      const request: InitialLoadRequest = {
        username: 'testuser',
        currency: 'USD',
      };

      mockRepository.getTotalExpenseDay.mockResolvedValue([]);
      mockRepository.getMovements.mockResolvedValue([]);
      mockRepository.getMovementsByTag.mockResolvedValue([]);
      mockRepository.getTotalBalance.mockResolvedValue([]);
      mockRepository.getYearlyBalance.mockResolvedValue([]);
      mockRepository.getMonthlyBalance.mockResolvedValue([]);
      mockRepository.getBalanceUntilDate.mockResolvedValue([]);
      mockRepository.getMonthlyExpensesUntilCurrentDay.mockResolvedValue([]);

      await getInitialLoadUseCase.execute(request);

      // Should call with current date (YYYY-MM-DD format)
      expect(mockRepository.getTotalExpenseDay).toHaveBeenCalledWith(
        'testuser',
        'USD',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      );
    });

    it('should normalize username to lowercase', async () => {
      const request: InitialLoadRequest = {
        username: 'TESTUSER',
        currency: 'USD',
      };

      mockRepository.getTotalExpenseDay.mockResolvedValue([]);
      mockRepository.getMovements.mockResolvedValue([]);
      mockRepository.getMovementsByTag.mockResolvedValue([]);
      mockRepository.getTotalBalance.mockResolvedValue([]);
      mockRepository.getYearlyBalance.mockResolvedValue([]);
      mockRepository.getMonthlyBalance.mockResolvedValue([]);
      mockRepository.getBalanceUntilDate.mockResolvedValue([]);
      mockRepository.getMonthlyExpensesUntilCurrentDay.mockResolvedValue([]);

      await getInitialLoadUseCase.execute(request);

      expect(mockRepository.getTotalExpenseDay).toHaveBeenCalledWith('testuser', 'USD', expect.any(String));
      expect(mockRepository.getMovements).toHaveBeenCalledWith('testuser', 'USD');
    });

    it('should use default currency when not provided', async () => {
      const request: InitialLoadRequest = {
        username: 'testuser',
      };

      mockRepository.getTotalExpenseDay.mockResolvedValue([]);
      mockRepository.getMovements.mockResolvedValue([]);
      mockRepository.getMovementsByTag.mockResolvedValue([]);
      mockRepository.getTotalBalance.mockResolvedValue([]);
      mockRepository.getYearlyBalance.mockResolvedValue([]);
      mockRepository.getMonthlyBalance.mockResolvedValue([]);
      mockRepository.getBalanceUntilDate.mockResolvedValue([]);
      mockRepository.getMonthlyExpensesUntilCurrentDay.mockResolvedValue([]);

      await getInitialLoadUseCase.execute(request);

      expect(mockRepository.getTotalExpenseDay).toHaveBeenCalledWith('testuser', 'USD', expect.any(String));
    });

    it('should include generalInfo and tripInfo for privileged users', async () => {
      const request: InitialLoadRequest = {
        username: 'anderokgo', // Privileged user
        currency: 'USD',
      };

      mockRepository.getTotalExpenseDay.mockResolvedValue([]);
      mockRepository.getMovements.mockResolvedValue([]);
      mockRepository.getMovementsByTag.mockResolvedValue([]);
      mockRepository.getTotalBalance.mockResolvedValue([]);
      mockRepository.getYearlyBalance.mockResolvedValue([]);
      mockRepository.getMonthlyBalance.mockResolvedValue([]);
      mockRepository.getBalanceUntilDate.mockResolvedValue([]);
      mockRepository.getMonthlyExpensesUntilCurrentDay.mockResolvedValue([]);
      mockRepository.getGeneralInfo.mockResolvedValue([{ info: 'general' }]);
      mockRepository.getTripInfo.mockResolvedValue([{ trip: 'vacation' }]);

      const result = await getInitialLoadUseCase.execute(request);

      expect(result.generalInfo).toEqual([{ info: 'general' }]);
      expect(result.tripInfo).toEqual([{ trip: 'vacation' }]);
      expect(mockRepository.getGeneralInfo).toHaveBeenCalled();
      expect(mockRepository.getTripInfo).toHaveBeenCalled();
    });

    it('should not include generalInfo and tripInfo for non-privileged users', async () => {
      const request: InitialLoadRequest = {
        username: 'regularuser',
        currency: 'USD',
      };

      mockRepository.getTotalExpenseDay.mockResolvedValue([]);
      mockRepository.getMovements.mockResolvedValue([]);
      mockRepository.getMovementsByTag.mockResolvedValue([]);
      mockRepository.getTotalBalance.mockResolvedValue([]);
      mockRepository.getYearlyBalance.mockResolvedValue([]);
      mockRepository.getMonthlyBalance.mockResolvedValue([]);
      mockRepository.getBalanceUntilDate.mockResolvedValue([]);
      mockRepository.getMonthlyExpensesUntilCurrentDay.mockResolvedValue([]);

      const result = await getInitialLoadUseCase.execute(request);

      expect(result.generalInfo).toBeUndefined();
      expect(result.tripInfo).toBeUndefined();
      expect(mockRepository.getGeneralInfo).not.toHaveBeenCalled();
      expect(mockRepository.getTripInfo).not.toHaveBeenCalled();
    });

    it('should throw error when username is not provided', async () => {
      const request: InitialLoadRequest = {
        currency: 'USD',
      };

      await expect(getInitialLoadUseCase.execute(request)).rejects.toThrow('Username is required');
    });

    it('should throw error when username is too short', async () => {
      const request: InitialLoadRequest = {
        username: 'ab', // Less than 3 characters
        currency: 'USD',
      };

      await expect(getInitialLoadUseCase.execute(request)).rejects.toThrow(
        'Username must be at least 3 characters'
      );
    });

    it('should throw error when username is empty string', async () => {
      const request: InitialLoadRequest = {
        username: '',
        currency: 'USD',
      };

      await expect(getInitialLoadUseCase.execute(request)).rejects.toThrow('Username is required');
    });

    it('should throw error when username is only whitespace', async () => {
      const request: InitialLoadRequest = {
        username: '   ',
        currency: 'USD',
      };

      await expect(getInitialLoadUseCase.execute(request)).rejects.toThrow(
        'Username must be at least 3 characters'
      );
    });

    it('should handle repository errors gracefully', async () => {
      const request: InitialLoadRequest = {
        username: 'testuser',
        currency: 'USD',
      };

      mockRepository.getTotalExpenseDay.mockRejectedValue(new Error('Database connection failed'));

      await expect(getInitialLoadUseCase.execute(request)).rejects.toThrow(
        'Failed to load initial data: Database connection failed'
      );
    });

    it('should handle unknown errors gracefully', async () => {
      const request: InitialLoadRequest = {
        username: 'testuser',
        currency: 'USD',
      };

      mockRepository.getTotalExpenseDay.mockRejectedValue('Unknown error');

      await expect(getInitialLoadUseCase.execute(request)).rejects.toThrow(
        'Failed to load initial data: Unknown error'
      );
    });

    it('should handle empty username with trim', async () => {
      const request: InitialLoadRequest = {
        username: '  testuser  ',
        currency: 'USD',
      };

      mockRepository.getTotalExpenseDay.mockResolvedValue([]);
      mockRepository.getMovements.mockResolvedValue([]);
      mockRepository.getMovementsByTag.mockResolvedValue([]);
      mockRepository.getTotalBalance.mockResolvedValue([]);
      mockRepository.getYearlyBalance.mockResolvedValue([]);
      mockRepository.getMonthlyBalance.mockResolvedValue([]);
      mockRepository.getBalanceUntilDate.mockResolvedValue([]);
      mockRepository.getMonthlyExpensesUntilCurrentDay.mockResolvedValue([]);

      await getInitialLoadUseCase.execute(request);

      // Should normalize to lowercase but trim is handled in validation
      expect(mockRepository.getTotalExpenseDay).toHaveBeenCalledWith(
        '  testuser  '.toLowerCase(),
        'USD',
        expect.any(String)
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle null username', async () => {
      const request: InitialLoadRequest = {
        username: null as any,
        currency: 'USD',
      };

      await expect(getInitialLoadUseCase.execute(request)).rejects.toThrow('Username is required');
    });

    it('should handle undefined username', async () => {
      const request: InitialLoadRequest = {
        username: undefined,
        currency: 'USD',
      };

      await expect(getInitialLoadUseCase.execute(request)).rejects.toThrow('Username is required');
    });

    it('should handle special characters in username', async () => {
      const request: InitialLoadRequest = {
        username: 'user@domain.com',
        currency: 'USD',
      };

      mockRepository.getTotalExpenseDay.mockResolvedValue([]);
      mockRepository.getMovements.mockResolvedValue([]);
      mockRepository.getMovementsByTag.mockResolvedValue([]);
      mockRepository.getTotalBalance.mockResolvedValue([]);
      mockRepository.getYearlyBalance.mockResolvedValue([]);
      mockRepository.getMonthlyBalance.mockResolvedValue([]);
      mockRepository.getBalanceUntilDate.mockResolvedValue([]);
      mockRepository.getMonthlyExpensesUntilCurrentDay.mockResolvedValue([]);

      await getInitialLoadUseCase.execute(request);

      expect(mockRepository.getTotalExpenseDay).toHaveBeenCalledWith('user@domain.com', 'USD', expect.any(String));
    });
  });
});
