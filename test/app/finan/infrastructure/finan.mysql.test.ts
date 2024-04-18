import { FinanMysqlRepository } from '../../../../src/app/finan/infrastructure/finan.mysql';
import { Database } from '../../../../src/helpers/my.database.helper';

// Mock the Database class
jest.mock('../../../../src/helpers/my.database.helper');

describe('FinanMysqlRepository', () => {
  let finanRepository: FinanMysqlRepository;

  beforeEach(() => {
    finanRepository = new FinanMysqlRepository();
  });

  it('should get total bank data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const data = '2023-09-25';
    /* const result = await finanRepository.getInitialLoad(data);

    expect(result).toEqual({
      balance: ['balance'],
      total_bank: {},
      movementSources: ['movementSources'],
      movementTag: ['movementTag'],
      movements: ['movements'],
      totalDay: ['totalDay'],
    }); */

    // Verify that the expected methods are called with the correct parameters
    /* expect(finanRepository.movements).toHaveBeenCalled();
    expect(finanRepository.balance).toHaveBeenCalled();
    expect(finanRepository.movementTag).toHaveBeenCalled();
    expect(finanRepository.movementSources).toHaveBeenCalled();
    expect(finanRepository.totalDay).toHaveBeenCalledWith(data);
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith('SELECT * from view_total_bank'); */
  });

  it('should get total day data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const data = '2023-09-25';
    const result = await finanRepository.totalDay(data);

    expect(result).toEqual({});

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith(
      `SELECT * from view_total_day  WHERE DATE(date_movement) = '${data}'`
    );
  });

  it('should get balance data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const result = await finanRepository.balance();

    expect(result).toEqual({});

    // Verify that the expected method is called
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith(
      'SELECT * from view_monthly_bills_incomes_no_exchange_order_row'
    );
  });

  it('should get movements data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const result = await finanRepository.movements();

    expect(result).toEqual({});

    // Verify that the expected method is called
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith('SELECT * from view_movements');
  });

  it('should get movement sources data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const result = await finanRepository.movementSources();

    expect(result).toEqual({});

    // Verify that the expected method is called
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith(
      'SELECT * from view_monthly_movements_order_by_source'
    );
  });

  it('should get movement tag data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const result = await finanRepository.movementTag();

    expect(result).toEqual({});

    // Verify that the expected method is called
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith(
      'SELECT * from view_monthly_movements_order_by_tag'
    );
  });

  it('should put a movement', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.myEscape as jest.Mock).mockReturnValue("'test'");
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const parameters = {
      name: 'test',
      val: '10',
      datemov: '2023-09-25',
      type: 1,
      tag: 'testtag',
    };

    const result = await finanRepository.putMovement(parameters);

    expect(result).toEqual({});

    // Verify that the expected method is called with the correct parameters
    expect(Database.prototype.myEscape).toHaveBeenCalledWith('test');
    expect(Database.prototype.myEscape).toHaveBeenCalledWith('testtag');
    /* expect(Database.prototype.executeQuery).toHaveBeenCalledWith(
      `proc_insert_movement('test', 10, '2023-09-25', 1, 'test')`
    ); */
  });
});
