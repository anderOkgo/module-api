import { FinanMysqlRepository } from '../../../../src/modules/finan/infrastructure/finan.mysql';
import { Database } from '../../../../src/infrastructure/my.database.helper';
//import { HDB } from '../../../../src/infrastructure/data/mysql/database';

// Mock the Database class
jest.mock('../../../../src/infrastructure/data/mysql/database');

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
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const data = { currency: 'USD' };
    const result = await finanRepository.totalBankRepository(data);

    expect(result).toEqual({});

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith(expect.any(String), ['USD', 10000]);
  });

  it('should get total day data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const data = { currency: 'USD', date: '2023-09-25' };
    const result = await finanRepository.totalDayRepository(data);

    expect(result).toEqual({});

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith(expect.any(String), ['2023-09-25', 'USD', 10000]);
  });

  it('should get balance data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const data = { currency: 'USD' };
    const result = await finanRepository.balanceRepository(data);

    expect(result).toEqual({});

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith(expect.any(String), ['USD', 10000]);
  });

  it('should get movements data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const data = { currency: 'USD' };
    const result = await finanRepository.movementRepository(data);

    expect(result).toEqual({});

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith(expect.any(String), ['USD', 10000]);
  });

  it('should get movement sources data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const data = { currency: 'USD' };
    const result = await finanRepository.movementSourcesRepository(data);

    expect(result).toEqual({});

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith(expect.any(String), ['USD', 10000]);
  });

  it('should get movement tag data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const data = { currency: 'USD' };
    const result = await finanRepository.movementTagRepository(data);

    expect(result).toEqual({});

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith(expect.any(String), ['USD', 10000]);
  });

  it('should put a movement', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const parameters = {
      movement_name: 'test',
      movement_val: 10,
      movement_date: '2023-09-25',
      movement_type: 1,
      movement_tag: 'testtag',
      currency: 'USD',
    };

    const result = await finanRepository.putMovementRepository(parameters);

    expect(result).toEqual({});

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith(expect.any(String), [
      'test',
      10,
      '2023-09-25',
      1,
      'testtag',
      'USD',
    ]);
  });
});
