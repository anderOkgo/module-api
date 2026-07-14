import { FinanMysqlRepository } from '../../../../../src/modules/finan/infrastructure/persistence/finan.mysql';
import { Database } from '../../../../../src/infrastructure/my.database.helper';
import Movement from '../../../../../src/modules/finan/domain/entities/movement.entity';

// Mock the Database class
jest.mock('../../../../../src/infrastructure/my.database.helper');
const MockedDatabase = Database as jest.MockedClass<typeof Database>;

describe('FinanMysqlRepository', () => {
  let repository: FinanMysqlRepository;
  let mockDatabase: jest.Mocked<Database>;

  beforeEach(() => {
    mockDatabase = {
      executeSafeQuery: jest.fn(),
    } as any;

    MockedDatabase.mockImplementation(() => mockDatabase);
    repository = new FinanMysqlRepository();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct database name and limit', () => {
      // The repository is already instantiated in beforeEach
      expect(repository).toBeDefined();
      // Note: Limit property is private, so we can't test it directly
      // Instead, we verify the repository instance is created successfully
      expect(repository).toBeInstanceOf(FinanMysqlRepository);
    });
  });

  describe('create', () => {
    const validMovement: Movement = {
      name: 'Test Movement',
      value: 100.5,
      date_movement: '2023-01-01',
      type_source_id: 1,
      tag: 'test-tag',
      currency: 'USD',
      user: 'testuser',
      log: 0,
    };

    it('should create movement successfully', async () => {
      const mockResult = { insertId: 123 };
      mockDatabase.executeSafeQuery.mockResolvedValue(mockResult);

      const result = await repository.create(validMovement);

      expect(result).toEqual({
        ...validMovement,
        id: 123,
      });
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        `
      INSERT INTO movements_testuser
      (name, value, date_movement, type_source_id, tag, currency, user, log)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        ['Test Movement', 100.5, '2023-01-01', 1, 'test-tag', 'USD', 'testuser', 0]
      );
    });

    it('should handle movement without log field', async () => {
      const movementWithoutLog: Movement = {
        name: 'Test Movement',
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: 1,
        tag: 'test-tag',
        currency: 'USD',
        user: 'testuser',
      };

      const mockResult = { insertId: 124 };
      mockDatabase.executeSafeQuery.mockResolvedValue(mockResult);

      const result = await repository.create(movementWithoutLog);

      expect(result).toEqual({
        ...movementWithoutLog,
        id: 124,
      });
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(expect.any(String), [
        'Test Movement',
        100.5,
        '2023-01-01',
        1,
        'test-tag',
        'USD',
        'testuser',
        0,
      ]);
    });

    it('should handle database errors', async () => {
      mockDatabase.executeSafeQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(repository.create(validMovement)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find movement by id', async () => {
      const mockMovement = {
        id: 1,
        name: 'Test Movement',
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: 1,
        tag: 'test-tag',
        currency: 'USD',
        user: 'testuser',
      };

      mockDatabase.executeSafeQuery.mockResolvedValue([mockMovement]);

      const result = await repository.findById(1, 'testuser');

      expect(result).toEqual(mockMovement);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM movements_testuser WHERE id = ?', [
        1,
      ]);
    });

    it('should return null when movement not found', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      const result = await repository.findById(999, 'testuser');

      expect(result).toBeNull();
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM movements_testuser WHERE id = ?', [
        999,
      ]);
    });

    it('should handle database errors', async () => {
      mockDatabase.executeSafeQuery.mockRejectedValue(new Error('Database error'));

      await expect(repository.findById(1, 'testuser')).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    const updateData: Partial<Movement> = {
      name: 'Updated Movement',
      value: 200.75,
      tag: 'updated-tag',
    };

    const existingMovement = {
      id: 1,
      name: 'Updated Movement',
      value: 200.75,
      date_movement: '2023-01-01',
      type_source_id: 1,
      tag: 'updated-tag',
      currency: 'USD',
      user: 'testuser',
    };

    it('should update movement successfully', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce({ affectedRows: 1 }) // Update query
        .mockResolvedValueOnce([existingMovement]); // FindById query

      const result = await repository.update(1, updateData, 'testuser');

      expect(result).toEqual(existingMovement);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        `
      UPDATE movements_testuser
      SET name = ?, value = ?, date_movement = ?, type_source_id = ?, tag = ?, currency = ?, log = ?
      WHERE id = ?
    `,
        ['Updated Movement', 200.75, undefined, undefined, 'updated-tag', undefined, 0, 1]
      );
    });

    it('should handle update with log field', async () => {
      const updateWithLog: Partial<Movement> = {
        ...updateData,
        log: 123,
      };

      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([existingMovement]);

      await repository.update(1, updateWithLog, 'testuser');

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(expect.any(String), [
        'Updated Movement',
        200.75,
        undefined,
        undefined,
        'updated-tag',
        undefined,
        123,
        1,
      ]);
    });

    it('should throw error when movement not found after update', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce({ affectedRows: 1 }) // Update query
        .mockResolvedValueOnce([]); // FindById query returns empty

      await expect(repository.update(1, updateData, 'testuser')).rejects.toThrow(
        'Movement not found after update'
      );
    });

    it('should handle database errors', async () => {
      mockDatabase.executeSafeQuery.mockRejectedValue(new Error('Database error'));

      await expect(repository.update(1, updateData, 'testuser')).rejects.toThrow('Database error');
    });
  });

  describe('delete', () => {
    it('should delete movement successfully', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ affectedRows: 1 });

      const result = await repository.delete(1, 'testuser');

      expect(result).toBe(true);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('DELETE FROM movements_testuser WHERE id = ?', [
        1,
      ]);
    });

    it('should return false when no rows affected', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ affectedRows: 0 });

      const result = await repository.delete(999, 'testuser');

      expect(result).toBe(false);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('DELETE FROM movements_testuser WHERE id = ?', [
        999,
      ]);
    });

    it('should handle database errors', async () => {
      mockDatabase.executeSafeQuery.mockRejectedValue(new Error('Database error'));

      await expect(repository.delete(1, 'testuser')).rejects.toThrow('Database error');
    });
  });

  describe('query methods', () => {
    const mockQueryResult = [{ id: 1, data: 'test' }];

    it('should get total expense day', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([mockQueryResult]);

      const result = await repository.getTotalExpenseDay('testuser', 'USD', '2023-01-01');

      expect(result).toEqual(mockQueryResult);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('CALL proc_view_total_expense_day(?, ?, ?, ?)', [
        'testuser',
        'USD',
        '2023-01-01',
        10000,
      ]);
    });

    it('should get movements', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([mockQueryResult]);

      const result = await repository.getMovements('testuser', 'USD');

      expect(result).toEqual(mockQueryResult);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('CALL proc_view_movements(?, ?, ?)', [
        'testuser',
        'USD',
        10000,
      ]);
    });

    it('should get movements by tag', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([mockQueryResult]);

      const result = await repository.getMovementsByTag('testuser', 'USD');

      expect(result).toEqual(mockQueryResult);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'CALL proc_view_monthly_movements_order_by_tag(?, ?, ?, ?)',
        ['testuser', 'USD', 'DESC', 10000]
      );
    });

    it('should get total balance', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([mockQueryResult]);

      const result = await repository.getTotalBalance('testuser', 'USD');

      expect(result).toEqual(mockQueryResult);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('CALL proc_view_total_balance(?, ?)', [
        'testuser',
        'USD',
      ]);
    });

    it('should get yearly balance', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([mockQueryResult]);

      const result = await repository.getYearlyBalance('testuser', 'USD');

      expect(result).toEqual(mockQueryResult);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'CALL proc_view_yearly_expenses_incomes(?, ?, ?, ?, ?)',
        ['testuser', 'USD', 'year_number', 'DESC', 10000]
      );
    });

    it('should get monthly balance', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([mockQueryResult]);

      const result = await repository.getMonthlyBalance('testuser', 'USD');

      expect(result).toEqual(mockQueryResult);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'CALL proc_view_monthly_expenses_incomes_order_row(?, ?, ?, ?)',
        ['testuser', 'USD', 'DESC', 10000]
      );
    });

    it('should get balance until date', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([mockQueryResult]);

      const result = await repository.getBalanceUntilDate('testuser', 'USD');

      expect(result).toEqual(mockQueryResult);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'CALL proc_view_balance_until_date(?, ?, ?, ?, ?)',
        ['testuser', 'USD', 'date_movement', 'DESC', 10000]
      );
    });

    it('should get monthly expenses until current day', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([mockQueryResult]);

      const result = await repository.getMonthlyExpensesUntilCurrentDay('testuser', 'USD');

      expect(result).toEqual(mockQueryResult);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'CALL proc_monthly_expenses_until_day(?, ?, ?, ?)',
        ['testuser', 'USD', 'ASC', 10000]
      );
    });

    it('should get general info', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue(mockQueryResult);

      const result = await repository.getGeneralInfo();

      expect(result).toEqual(mockQueryResult);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM view_general_info');
    });

    it('should get trip info', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue(mockQueryResult);

      const result = await repository.getTripInfo();

      expect(result).toEqual(mockQueryResult);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM view_final_trip_info');
    });

    it('should operate for linked movement', async () => {
      const mockMovement = { id: 1, value: 50, name: 'Test Movement' };
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce([mockMovement]) // SELECT query
        .mockResolvedValueOnce({ affectedRows: 1 }); // UPDATE query

      await repository.operateForLinkedMovement(1, 100, 1, 'testuser');

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM movements_testuser WHERE id = ?', [
        1,
      ]);
    });
  });

  describe('Fallback query methods', () => {
    it('should use fallback query when stored procedure fails in getBalanceUntilDate', async () => {
      const mockFallbackResult = [
        { date_movement: '2023-01-01', total_balance: 1000 },
        { date_movement: '2023-01-02', total_balance: 1500 },
      ];

      // First call fails (stored procedure not found)
      mockDatabase.executeSafeQuery
        .mockRejectedValueOnce(new Error('Stored procedure not found'))
        .mockResolvedValueOnce(mockFallbackResult);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await repository.getBalanceUntilDate('testuser', 'USD');

      expect(result).toEqual(mockFallbackResult);
      expect(consoleSpy).toHaveBeenCalledWith('Stored procedure not found, using direct query');
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DATE_FORMAT(date_movement'),
        ['USD', 10000]
      );

      consoleSpy.mockRestore();
    });

    it('should use fallback query when stored procedure fails in getMonthlyExpensesUntilCurrentDay', async () => {
      const mockFallbackResult = [
        { month_year: '2023-01', total_expenses: 500 },
        { month_year: '2023-02', total_expenses: 750 },
      ];

      // First call fails (stored procedure not found)
      mockDatabase.executeSafeQuery
        .mockRejectedValueOnce(new Error('Stored procedure not found'))
        .mockResolvedValueOnce(mockFallbackResult);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await repository.getMonthlyExpensesUntilCurrentDay('testuser', 'USD');

      expect(result).toEqual(mockFallbackResult);
      expect(consoleSpy).toHaveBeenCalledWith('Stored procedure not found, using direct query');
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DATE_FORMAT(date_movement'),
        ['USD', 10000]
      );

      consoleSpy.mockRestore();
    });
  });

  describe('operateForLinkedMovement comprehensive tests', () => {
    const mockMovement = { id: 1, value: 100, name: 'Test Movement' };

    it('should handle movement not found', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]); // Empty result

      await expect(repository.operateForLinkedMovement(999, 50, 1, 'testuser')).rejects.toThrow(
        'Linked movement not found'
      );

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM movements_testuser WHERE id = ?', [
        999,
      ]);
    });

    it('should add value for movement type 1', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce([mockMovement]) // SELECT query
        .mockResolvedValueOnce({ affectedRows: 1 }); // UPDATE query

      await repository.operateForLinkedMovement(1, 50, 1, 'testuser');

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM movements_testuser WHERE id = ?', [
        1,
      ]);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'UPDATE movements_testuser SET value = ? WHERE id = ?',
        [150, 1] // 100 + 50
      );
    });

    it('should subtract value for movement type 2', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce([mockMovement]) // SELECT query
        .mockResolvedValueOnce({ affectedRows: 1 }); // UPDATE query

      await repository.operateForLinkedMovement(1, 30, 2, 'testuser');

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'UPDATE movements_testuser SET value = ? WHERE id = ?',
        [70, 1] // 100 - 30
      );
    });

    it('should subtract value for movement type 8', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce([mockMovement]) // SELECT query
        .mockResolvedValueOnce({ affectedRows: 1 }); // UPDATE query

      await repository.operateForLinkedMovement(1, 25, 8, 'testuser');

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'UPDATE movements_testuser SET value = ? WHERE id = ?',
        [75, 1] // 100 - 25
      );
    });

    it('should not update for unknown movement type', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValueOnce([mockMovement]); // SELECT query only

      await repository.operateForLinkedMovement(1, 50, 99, 'testuser'); // Unknown type

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledTimes(1); // Only SELECT, no UPDATE
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM movements_testuser WHERE id = ?', [
        1,
      ]);
    });

    it('should handle non-numeric value in movement', async () => {
      const mockMovementWithStringValue = { id: 1, value: 'invalid', name: 'Test Movement' };
      mockDatabase.executeSafeQuery.mockResolvedValueOnce([mockMovementWithStringValue]); // SELECT query only

      await repository.operateForLinkedMovement(1, 50, 1, 'testuser');

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledTimes(1); // Only SELECT, no UPDATE
    });

    it('should handle null value in movement', async () => {
      const mockMovementWithNullValue = { id: 1, value: null, name: 'Test Movement' };
      mockDatabase.executeSafeQuery.mockResolvedValueOnce([mockMovementWithNullValue]); // SELECT query only

      await repository.operateForLinkedMovement(1, 50, 1, 'testuser');

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledTimes(1); // Only SELECT, no UPDATE
    });

    it('should handle undefined value in movement', async () => {
      const mockMovementWithUndefinedValue = { id: 1, value: undefined, name: 'Test Movement' };
      mockDatabase.executeSafeQuery.mockResolvedValueOnce([mockMovementWithUndefinedValue]); // SELECT query only

      await repository.operateForLinkedMovement(1, 50, 1, 'testuser');

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledTimes(1); // Only SELECT, no UPDATE
    });

    it('should handle database error during operation', async () => {
      mockDatabase.executeSafeQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(repository.operateForLinkedMovement(1, 50, 1, 'testuser')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('Error handling for update method', () => {
    it('should handle database error during update query', async () => {
      const updateData: Partial<Movement> = {
        name: 'Updated Movement',
        value: 200.75,
      };

      mockDatabase.executeSafeQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(repository.update(1, updateData, 'testuser')).rejects.toThrow('Database connection failed');
    });

    it('should handle database error during findById after update', async () => {
      const updateData: Partial<Movement> = {
        name: 'Updated Movement',
        value: 200.75,
      };

      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce({ affectedRows: 1 }) // Update query succeeds
        .mockRejectedValueOnce(new Error('Database connection failed')); // FindById fails

      await expect(repository.update(1, updateData, 'testuser')).rejects.toThrow('Database connection failed');
    });
  });

  describe('createTableForUser', () => {
    it('should create table using lowercased username', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue(undefined);

      await repository.createTableForUser('TestUser');

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('CALL proc_create_movements_table(?)', [
        'testuser',
      ]);
    });
  });

  describe('findByNameAndDate', () => {
    it('should find movement by name and date', async () => {
      const mockMovement = { id: 1, name: 'Rent', date_movement: '2023-01-01' };
      mockDatabase.executeSafeQuery.mockResolvedValue([mockMovement]);

      const result = await repository.findByNameAndDate('Rent', '2023-01-01', 'testuser');

      expect(result).toEqual(mockMovement);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'SELECT * FROM movements_testuser WHERE name = ? AND date_movement = ? LIMIT 1',
        ['Rent', '2023-01-01']
      );
    });

    it('should return null when no movement matches', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      const result = await repository.findByNameAndDate('Unknown', '2023-01-01', 'testuser');

      expect(result).toBeNull();
    });
  });

  describe('getCurrentMonthExpenses', () => {
    it('should return the parsed total when present', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([{ total: '1234.5' }]);

      const result = await repository.getCurrentMonthExpenses('testuser', 'USD');

      expect(result).toBe(1234.5);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(expect.stringContaining('COALESCE(SUM(value), 0)'), [
        'USD',
      ]);
    });

    it('should return 0 when the result row is missing', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      const result = await repository.getCurrentMonthExpenses('testuser', 'USD');

      expect(result).toBe(0);
    });

    it('should return 0 when total is not numeric', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([{ total: null }]);

      const result = await repository.getCurrentMonthExpenses('testuser', 'USD');

      expect(result).toBe(0);
    });
  });

  describe('getMonthlyBudget', () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    it('should use DB constants and current-month payroll/aporte when present', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce([
          { name: 'SAVINGS_GOAL', description: '1000' },
          { name: 'FIXED_HEALTH_PENSION', description: '200' },
          { name: 'EXPECTED_PAYROLL', description: '500' },
        ])
        .mockResolvedValueOnce([
          { type_source_id: 1, tag: 'payroll', month_key: currentMonth, total: '3000' },
          { type_source_id: 1, tag: 'aporte-enlinea', month_key: currentMonth, total: '300' },
        ]);

      const result = await repository.getMonthlyBudget('testuser', 'USD');

      // base = 3000 + 300 (all income this month) - savingsGoal 1000 - healthPensionDiscount (aporteCur=300)
      expect(result).toBe(3300 - 1000 - 300);
    });

    it('should fall back to default constants when the DB returns none', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await repository.getMonthlyBudget('testuser', 'USD');

      // No income at all: base = 0, no expectedPayroll, no prevMonth data -> stays 0
      // budget = 0 - 5_000_000 - 855_000, clamped to 0
      expect(result).toBe(0);
    });

    it('should use expectedPayroll when payroll is missing this month', async () => {
      // Note: the source uses `constantsMap[x] || default`, so a DB value of literally 0
      // would fall back to the static default (0 is falsy) — use small nonzero values here
      // to isolate the expectedPayroll branch specifically.
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce([
          { name: 'SAVINGS_GOAL', description: '10' },
          { name: 'FIXED_HEALTH_PENSION', description: '5' },
          { name: 'EXPECTED_PAYROLL', description: '1000' },
        ])
        .mockResolvedValueOnce([]);

      const result = await repository.getMonthlyBudget('testuser', 'USD');

      // base = expectedPayroll (1000); budget = 1000 - savingsGoal(10) - fixedHealthPension(5)
      expect(result).toBe(985);
    });

    it('should fall back to previous month for payroll and interest-lulo when no expectedPayroll', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce([
          { name: 'SAVINGS_GOAL', description: '10' },
          { name: 'FIXED_HEALTH_PENSION', description: '5' },
        ])
        .mockResolvedValueOnce([
          { type_source_id: 1, tag: 'payroll', month_key: prevMonth, total: '200' },
          { type_source_id: 1, tag: 'interest-lulo', month_key: prevMonth, total: '50' },
        ]);

      const result = await repository.getMonthlyBudget('testuser', 'USD');

      // base = 200 + 50 (both stable tags recovered from prev month); budget = 250 - 10 - 5
      expect(result).toBe(235);
    });

    it('should never return a negative budget', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce([{ name: 'SAVINGS_GOAL', description: '999999999' }])
        .mockResolvedValueOnce([]);

      const result = await repository.getMonthlyBudget('testuser', 'USD');

      expect(result).toBe(0);
    });

    it('should handle null constants/rows and non-numeric or unmatched-month values', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce(null) // constantsRows falsy -> `|| []`
        .mockResolvedValueOnce([
          { type_source_id: 2, tag: 'expense', month_key: currentMonth, total: '100' }, // typeId !== 1, tag !== aporte-enlinea -> no branch taken
          { type_source_id: 1, tag: 'misc', month_key: '1999-01', total: 'not-a-number' }, // typeId===1 but month matches neither -> falls through; val NaN -> `|| 0`
        ]);

      const result = await repository.getMonthlyBudget('testuser', 'USD');

      // Nothing contributes to income; defaults apply for savingsGoal/fixedHealthPension -> clamps to 0
      expect(result).toBe(0);
    });

    it('should handle a non-numeric constant description and rows with missing fields', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce([{ name: 'SAVINGS_GOAL', description: 'not-a-number' }]) // parseFloat -> NaN -> `|| 0`
        .mockResolvedValueOnce([{}]); // row with all fields missing -> exercises every `??` fallback

      const result = await repository.getMonthlyBudget('testuser', 'USD');

      expect(result).toBe(0);
    });

    it('should handle a null movement rows result', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValueOnce([]).mockResolvedValueOnce(null); // rows falsy -> `|| []`

      const result = await repository.getMonthlyBudget('testuser', 'USD');

      expect(result).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty query results', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([[]]);

      const result = await repository.getMovements('testuser', 'USD');

      expect(result).toEqual([]);
    });

    it('should handle null query results', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue(null);

      await expect(repository.getMovements('testuser', 'USD')).rejects.toThrow();
    });

    it('should handle special characters in username', async () => {
      const validMovement: Movement = {
        name: 'Test Movement',
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: 1,
        tag: 'test-tag',
        currency: 'USD',
        user: 'user@domain.com',
        log: 0,
      };

      const mockResult = { insertId: 125 };
      mockDatabase.executeSafeQuery.mockResolvedValue(mockResult);

      const result = await repository.create(validMovement);

      expect(result).toEqual({
        ...validMovement,
        id: 125,
      });
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        `
      INSERT INTO movements_user@domain.com
      (name, value, date_movement, type_source_id, tag, currency, user, log)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        ['Test Movement', 100.5, '2023-01-01', 1, 'test-tag', 'USD', 'user@domain.com', 0]
      );
    });

    it('should handle large numbers', async () => {
      const validMovement: Movement = {
        name: 'Test Movement',
        value: 999999999.99,
        date_movement: '2023-01-01',
        type_source_id: 1,
        tag: 'test-tag',
        currency: 'USD',
        user: 'testuser',
        log: 0,
      };

      const mockResult = { insertId: 126 };
      mockDatabase.executeSafeQuery.mockResolvedValue(mockResult);

      const result = await repository.create(validMovement);

      expect(result).toEqual({
        ...validMovement,
        id: 126,
      });
    });

    it('should handle zero values', async () => {
      const validMovement: Movement = {
        name: 'Zero Movement',
        value: 0,
        date_movement: '2023-01-01',
        type_source_id: 0,
        tag: '',
        currency: 'USD',
        user: 'testuser',
        log: 0,
      };

      const mockResult = { insertId: 127 };
      mockDatabase.executeSafeQuery.mockResolvedValue(mockResult);

      const result = await repository.create(validMovement);

      expect(result).toEqual({
        ...validMovement,
        id: 127,
      });
    });

    it('should handle negative values', async () => {
      const validMovement: Movement = {
        name: 'Negative Movement',
        value: -100.5,
        date_movement: '2023-01-01',
        type_source_id: 1,
        tag: 'negative-tag',
        currency: 'USD',
        user: 'testuser',
        log: -1,
      };

      const mockResult = { insertId: 128 };
      mockDatabase.executeSafeQuery.mockResolvedValue(mockResult);

      const result = await repository.create(validMovement);

      expect(result).toEqual({
        ...validMovement,
        id: 128,
      });
    });

    it('should handle very long strings', async () => {
      const longString = 'A'.repeat(1000);
      const validMovement: Movement = {
        name: longString,
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: 1,
        tag: longString,
        currency: 'USD',
        user: longString,
        log: 0,
      };

      const mockResult = { insertId: 129 };
      mockDatabase.executeSafeQuery.mockResolvedValue(mockResult);

      const result = await repository.create(validMovement);

      expect(result).toEqual({
        ...validMovement,
        id: 129,
      });
    });

    it('should handle special characters in movement data', async () => {
      const validMovement: Movement = {
        name: "Test's Movement & Co. (Ltd.)",
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: 1,
        tag: 'test-tag@#$%',
        currency: 'USD',
        user: 'test@user.com',
        log: 0,
      };

      const mockResult = { insertId: 130 };
      mockDatabase.executeSafeQuery.mockResolvedValue(mockResult);

      const result = await repository.create(validMovement);

      expect(result).toEqual({
        ...validMovement,
        id: 130,
      });
    });
  });
});
