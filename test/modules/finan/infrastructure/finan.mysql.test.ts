import { FinanMysqlRepository } from '../../../../src/modules/finan/infrastructure/finan.mysql';
import { Database } from '../../../../src/infrastructure/my.database.helper';
import { DataParams } from '../../../../src/modules/finan/infrastructure/models/dataparams';

jest.mock('../../../../src/infrastructure/my.database.helper');

describe('FinanMysqlRepository', () => {
  let finanRepository: FinanMysqlRepository;
  let mockExecuteSafeQuery: jest.Mock;

  const mockData: DataParams = {
    username: 'testuser',
    currency: 'USD',
    date: '2024-03-20',
  };

  beforeEach(() => {
    mockExecuteSafeQuery = jest.fn();
    (Database as jest.Mock).mockImplementation(() => ({
      executeSafeQuery: mockExecuteSafeQuery,
    }));
    finanRepository = new FinanMysqlRepository();
  });

  describe('getInitialLoad', () => {
    beforeEach(() => {
      mockExecuteSafeQuery
        .mockResolvedValueOnce([]) // create table
        .mockResolvedValueOnce([[{ total: 100 }]]) // totalExpenseDay
        .mockResolvedValueOnce([[{ id: 1 }]]) // movements
        .mockResolvedValueOnce([[{ tag: 'food' }]]) // movementTag
        .mockResolvedValueOnce([[{ balance: 1000 }]]) // totalBalance
        .mockResolvedValueOnce([[{ year: 2024 }]]) // yearlyBalance
        .mockResolvedValueOnce([[{ month: 'March' }]]) // monthlyBalance
        .mockResolvedValueOnce([[{ date: '2024-03-20' }]]); // balanceUntilDate
    });

    it('should fetch all required data for regular user', async () => {
      const result = await finanRepository.getInitialLoad(mockData);

      expect(result).toEqual({
        totalExpenseDay: [{ total: 100 }],
        movements: [{ id: 1 }],
        movementTag: [{ tag: 'food' }],
        totalBalance: [{ balance: 1000 }],
        yearlyBalance: [{ year: 2024 }],
        monthlyBalance: [{ month: 'March' }],
        balanceUntilDate: [{ date: '2024-03-20' }],
      });
    });

    it('should include additional info for anderokgo user', async () => {
      mockExecuteSafeQuery
        .mockResolvedValueOnce([]) // create table
        .mockResolvedValueOnce([[{ total: 100 }]]) // totalExpenseDay
        .mockResolvedValueOnce([[{ id: 1 }]]) // movements
        .mockResolvedValueOnce([[{ tag: 'food' }]]) // movementTag
        .mockResolvedValueOnce([[{ balance: 1000 }]]) // totalBalance
        .mockResolvedValueOnce([[{ year: 2024 }]]) // yearlyBalance
        .mockResolvedValueOnce([[{ month: 'March' }]]) // monthlyBalance
        .mockResolvedValueOnce([[{ date: '2024-03-20' }]]) // balanceUntilDate
        .mockResolvedValueOnce([{ general: 'info' }]) // generalInfo
        .mockResolvedValueOnce([{ trip: 'info' }]); // tripInfo

      const result = await finanRepository.getInitialLoad({ ...mockData, username: 'anderokgo' });

      expect(result).toHaveProperty('generalInfo');
      expect(result).toHaveProperty('tripInfo');
    });
  });

  describe('Movement Operations', () => {
    const mockMovement = {
      movement_name: 'Test',
      movement_val: 100,
      movement_date: '2024-03-20',
      movement_type: 1,
      movement_tag: 'food',
      currency: 'USD',
      username: 'testuser',
    };

    describe('operateFor', () => {
      beforeEach(() => {
        mockExecuteSafeQuery.mockResolvedValueOnce([{ value: 200 }]);
      });

      it('should handle addition (type 1)', async () => {
        await finanRepository.operateFor({
          ...mockMovement,
          operate_for: 1,
          movement_type: 1,
        });

        expect(mockExecuteSafeQuery).toHaveBeenLastCalledWith(expect.stringContaining('UPDATE'), [300, 1]);
      });

      it('should handle subtraction (type 2)', async () => {
        await finanRepository.operateFor({
          ...mockMovement,
          operate_for: 1,
          movement_type: 2,
        });

        expect(mockExecuteSafeQuery).toHaveBeenLastCalledWith(expect.stringContaining('UPDATE'), [100, 1]);
      });
    });

    describe('putMovement', () => {
      it('should insert new movement', async () => {
        await finanRepository.putMovement(mockMovement);

        expect(mockExecuteSafeQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'), [
          'Test',
          100,
          '2024-03-20',
          1,
          'food',
          'USD',
          'testuser',
          null,
        ]);
      });

      it('should handle operate_for when provided', async () => {
        mockExecuteSafeQuery
          .mockResolvedValueOnce([{ value: 200 }]) // for operateFor query
          .mockResolvedValueOnce({ insertId: 1 }); // for insert query

        await finanRepository.putMovement({
          ...mockMovement,
          operate_for: 1,
        });

        expect(mockExecuteSafeQuery).toHaveBeenCalledTimes(3); // SELECT, UPDATE, and INSERT
      });
    });

    describe('updateMovementById', () => {
      it('should update existing movement', async () => {
        await finanRepository.updateMovementById(1, mockMovement);

        expect(mockExecuteSafeQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE'), [
          'Test',
          100,
          '2024-03-20',
          1,
          'food',
          'USD',
          'testuser',
          null,
          1,
        ]);
      });
    });

    describe('deleteMovementById', () => {
      it('should delete movement', async () => {
        await finanRepository.deleteMovementById(1, 'testuser');

        expect(mockExecuteSafeQuery).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'), [1]);
      });
    });
  });

  describe('Data Retrieval Methods', () => {
    beforeEach(() => {
      mockExecuteSafeQuery.mockResolvedValue([[{ data: 'test' }]]);
    });

    it('should fetch totalExpenseDay', async () => {
      await finanRepository.totalExpenseDay(mockData);
      expect(mockExecuteSafeQuery).toHaveBeenCalledWith('CALL proc_view_total_expense_day(?, ?, ?, ?)', [
        'testuser',
        'USD',
        '2024-03-20',
        10000,
      ]);
    });

    it('should fetch movements', async () => {
      await finanRepository.movement(mockData);
      expect(mockExecuteSafeQuery).toHaveBeenCalledWith('CALL proc_view_movements(?, ?, ?)', [
        'testuser',
        'USD',
        10000,
      ]);
    });

    it('should fetch movementTag', async () => {
      await finanRepository.movementTag(mockData);
      expect(mockExecuteSafeQuery).toHaveBeenCalledWith(
        'CALL proc_view_monthly_movements_order_by_tag(?, ?, ?, ?)',
        ['testuser', 'USD', 'DESC', 10000]
      );
    });

    it('should fetch totalBalance', async () => {
      await finanRepository.totalBalance(mockData);
      expect(mockExecuteSafeQuery).toHaveBeenCalledWith('CALL proc_view_total_balance(?, ?)', ['testuser', 'USD']);
    });

    it('should fetch yearlyBalance', async () => {
      await finanRepository.yearlyBalance(mockData);
      expect(mockExecuteSafeQuery).toHaveBeenCalledWith('CALL proc_view_yearly_expenses_incomes(?, ?, ?, ?, ?)', [
        'testuser',
        'USD',
        'year_number',
        'DESC',
        10000,
      ]);
    });

    it('should fetch monthlyBalance', async () => {
      await finanRepository.monthlyBalance(mockData);
      expect(mockExecuteSafeQuery).toHaveBeenCalledWith(
        'CALL proc_view_monthly_expenses_incomes_order_row(?, ?, ?, ?)',
        ['testuser', 'USD', 'DESC', 10000]
      );
    });

    it('should fetch balanceUntilDate', async () => {
      await finanRepository.balanceUntilDate(mockData);
      expect(mockExecuteSafeQuery).toHaveBeenCalledWith('CALL proc_view_balance_until_date(?, ?, ?, ?, ?)', [
        'testuser',
        'USD',
        'date_movement',
        'DESC',
        10000,
      ]);
    });
  });
});
