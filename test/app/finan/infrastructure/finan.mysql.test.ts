import { FinanMysqlRepository } from '../../../../src/app/finan/infrastructure/finan.mysql';
import { Database } from '../../../../src/helpers/my.database.helper';
//import { HDB } from '../../../../src/helpers/data/mysql/database';

// Mock the Database class
jest.mock('../../../../src/helpers/data/mysql/database');

describe('FinanMysqlRepository', () => {
  let finanRepository: FinanMysqlRepository;

  beforeEach(() => {
    finanRepository = new FinanMysqlRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get total bank data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ total: 1000 }]);

    const data = { currency: 'USD', username: 'testuser' };
    const result = await finanRepository.totalBank(data);

    expect(result).toEqual({ total: 1000 });

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith(expect.any(String), ['testuser', 'USD']);
  });

  it('should get total day data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ total: 100 }]);

    const data = { currency: 'USD', date: '2023-09-25', username: 'testuser' };
    const result = await finanRepository.totalDay(data);

    expect(result).toEqual({ total: 100 });

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith(expect.any(String), [
      'testuser',
      'USD',
      '2023-09-25',
      10000,
    ]);
  });

  it('should get balance data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ balance: 500 }]);

    const data = { currency: 'USD', username: 'testuser' };
    const result = await finanRepository.balance(data);

    expect(result).toEqual({ balance: 500 });

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith(expect.any(String), [
      'testuser',
      'USD',
      'DESC',
      10000,
    ]);
  });

  it('should get movements data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ movements: [] }]);

    const data = { currency: 'USD', username: 'testuser' };
    const result = await finanRepository.movement(data);

    expect(result).toEqual({ movements: [] });

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith(expect.any(String), [
      'testuser',
      'USD',
      10000,
    ]);
  });

  it('should get movement sources data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ sources: [] }]);

    const data = { currency: 'USD', username: 'testuser' };
    const result = await finanRepository.movementSources(data);

    expect(result).toEqual({ sources: [] });

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith(expect.any(String), [
      'testuser',
      'USD',
      'DESC',
      10000,
    ]);
  });

  it('should get movement tag data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ tags: [] }]);

    const data = { currency: 'USD', username: 'testuser' };
    const result = await finanRepository.movementTag(data);

    expect(result).toEqual({ tags: [] });

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith(expect.any(String), [
      'testuser',
      'USD',
      'DESC',
      10000,
    ]);
  });

  it('should put a movement', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ success: true }]);

    const parameters = {
      movement_name: 'test',
      movement_val: 10,
      movement_date: '2023-09-25',
      movement_type: 1,
      movement_tag: 'testtag',
      currency: 'USD',
      username: 'testuser',
    };

    const result = await finanRepository.putMovement(parameters);

    expect(result).toEqual([{ success: true }]);

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith(expect.any(String), [
      'test',
      10,
      '2023-09-25',
      1,
      'testtag',
      'USD',
      'testuser',
    ]);
  });
});
