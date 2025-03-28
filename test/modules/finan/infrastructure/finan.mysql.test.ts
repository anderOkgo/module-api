import { FinanMysqlRepository } from '../../../../src/modules/finan/infrastructure/finan.mysql';
import { Database } from '../../../../src/infrastructure/my.database.helper';
//import { HDB } from '../../../../src/infrastructure/data/mysql/database';

// Mock the dependencies
jest.mock('../../../../src/infrastructure/my.database.helper');

describe('FinanMysqlRepository', () => {
  let finanRepository: FinanMysqlRepository;

  beforeEach(() => {
    finanRepository = new FinanMysqlRepository();
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get initial load data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue({
      movements: [],
      balance: [],
      yearlyBalance: [],
      movementTag: [],
      totalDay: [],
      balanceUntilDate: [],
      totalBank: [],
    });

    const data = { currency: 'USD', username: 'testuser' };
    const result = await finanRepository.getInitialLoad(data);

    expect(result).toEqual({
      movements: [],
      balance: [],
      yearlyBalance: [],
      movementTag: [],
      totalDay: [],
      balanceUntilDate: [],
      totalBank: [],
    });
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith(
      'CALL proc_view_monthly_expenses_incomes_order_row(?, ?, ?, ?)',
      ['testuser', 'USD', 'DESC', 10000]
    );
  });

  it('should get total bank data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ total: 1000 }]);

    const data = { currency: 'USD', username: 'testuser' };
    const result = await finanRepository.getInitialLoad(data);

    expect(result.totalBank).toEqual([{ total: 1000 }]);
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith('CALL proc_view_total_bank(?, ?)', [
      'testuser',
      'USD',
    ]);
  });

  it('should get total day data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ total: 100 }]);

    const data = { currency: 'USD', date: '2023-09-25', username: 'testuser' };
    const result = await finanRepository.getInitialLoad(data);

    expect(result.totalDay).toEqual([{ total: 100 }]);
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith('CALL proc_view_total_day(?, ?, ?)', [
      'testuser',
      'USD',
      '2023-09-25',
    ]);
  });

  it('should get balance data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ balance: 500 }]);

    const data = { currency: 'USD', username: 'testuser' };
    const result = await finanRepository.getInitialLoad(data);

    expect(result.balance).toEqual([{ balance: 500 }]);
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith(
      'CALL proc_view_monthly_expenses_incomes_order_row(?, ?, ?, ?)',
      ['testuser', 'USD', 'DESC', 10000]
    );
  });

  it('should get yearly balance data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue({ yearly_balance: 1200 });

    const data = { currency: 'USD', username: 'testuser' };
    const result = await finanRepository.getInitialLoad(data);

    expect(result.yearlyBalance).toEqual({ yearly_balance: 1200 });
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith(
      'CALL proc_view_yearly_expenses_incomes(?, ?, ?, ?, ?)',
      ['testuser', 'USD', 'year_number', 'DESC', 10000]
    );
  });

  it('should get movement sources data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ sources: [] }]);

    const data = { currency: 'USD', username: 'testuser' };
    const result = await finanRepository.getInitialLoad(data);

    expect(result.movementSources).toEqual([{ sources: [] }]);
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith(
      'CALL proc_view_monthly_movements_order_by_source(?, ?, ?, ?)',
      ['testuser', 'USD', 'DESC', 10000]
    );
  });

  it('should put a movement', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue({ affectedRows: 1 });

    const movement = {
      movement_name: 'test',
      movement_val: 10,
      movement_date: '2023-09-25',
      movement_type: 1,
      movement_tag: 'testtag',
      currency: 'USD',
      username: 'testuser',
    };

    const result = await finanRepository.putMovement(movement);

    expect(result).toEqual({ affectedRows: 1 });
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith(
      'INSERT INTO movements_testuser\n        (name, value, date_movement, type_source_id, tag, currency, user, log)\n        VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['test', 10, '2023-09-25', 1, 'testtag', 'USD', 'testuser', null]
    );
  });
});
