import { Request, Response, NextFunction } from '../../../../src/infrastructure/middle.helper';
import {
  defaultSeries,
  getProductions,
  getProductionYears,
} from '../../../../src/modules/series/application/series.controller';
import {
  getProductionsService,
  getProductionYearsService,
} from '../../../../src/modules/series/domain/services/index';
import { validateProduction } from '../../../../src/modules/series/application/series.validation';

// Mock the dependencies
jest.mock('../../../../src/modules/series/domain/services/index', () => ({
  getProductionsService: jest.fn(),
  getProductionYearsService: jest.fn(),
}));

jest.mock('../../../../src/modules/series/application/series.validation', () => ({
  validateProduction: jest.fn(),
}));

describe('Series Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res as Response),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should respond with productions when getProduction succeeds', async () => {
    const productions = [{ id: 1, name: 'Test Production' }];

    // Mock validation to return a valid result
    (validateProduction as jest.Mock).mockReturnValue({ valid: true, result: { limit: '10' } });

    // Mock the service to return success response
    (getProductionsService as jest.Mock).mockResolvedValue(productions);

    await getProductions(req as Request, res as Response);

    expect(validateProduction).toHaveBeenCalled();
    expect(getProductionsService).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(productions);
  });

  it('should respond with a 500 error for getProductions when there is a system error', async () => {
    // Mock validation to return a valid result
    (validateProduction as jest.Mock).mockReturnValue({ valid: true, result: { limit: '10' } });

    // Mock with error response format matching the controller
    (getProductionsService as jest.Mock).mockResolvedValue({
      errorSys: true,
      message: 'Database error',
    });

    await getProductions(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith('Database error');
  });

  it('should respond with 400 for invalid production request', async () => {
    // Mock validation to return invalid result
    (validateProduction as jest.Mock).mockReturnValue({
      valid: false,
      errors: { message: 'Invalid input' },
    });

    await getProductions(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input' });
  });

  it('should respond with production years when getProductionYear succeeds', async () => {
    const years = [{ year: 2020 }, { year: 2021 }];

    // Mock the getProductionYearsService to return years (not error)
    (getProductionYearsService as jest.Mock).mockResolvedValue(years);

    await getProductionYears(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(years);
  });

  it('should respond with a 500 error for getProductionYears when there is a system error', async () => {
    // Mock with error response format
    (getProductionYearsService as jest.Mock).mockResolvedValue({
      errorSys: true,
      message: 'Database error',
    });

    await getProductionYears(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith('Database error');
  });

  it('should respond with a message for defaultSeries', async () => {
    await defaultSeries(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ msg: 'API Series Working' });
  });
});
