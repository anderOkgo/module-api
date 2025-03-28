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

// Mock the dependencies
jest.mock('../../../../src/modules/series/domain/services/index', () => ({
  getProductionsService: jest.fn(),
  getProductionYearsService: jest.fn(),
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

    // Mock the getProduction function to resolve with productions
    (getProductionsService as jest.Mock).mockResolvedValue(productions);

    // Simulate a request with a request body (e.g., filters)
    req.body = { category: 'Action' };

    await getProductions(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(productions);
  });

  it('should respond with a 404 error for getProductions when productions are not found', async () => {
    // Mock the getProduction function to resolve with null (productions not found)
    (getProductionsService as jest.Mock).mockResolvedValue(null);

    // Simulate a request with a request body (e.g., filters)
    req.body = { category: 'Drama' };

    await getProductions(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Productions not found' });
  });

  it('should respond with production years when getProductionYear succeeds', async () => {
    const years = [2020, 2021, 2022];

    // Mock the getProductionYear function to resolve with years
    (getProductionYearsService as jest.Mock).mockResolvedValue(years);

    // Simulate a request without a request body (e.g., no filters)
    req.body = {};

    await getProductionYears(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(years);
  });

  it('should respond with a 404 error for getProductionYears when production years are not found', async () => {
    // Mock the getProductionYear function to resolve with null (production years not found)
    (getProductionYearsService as jest.Mock).mockResolvedValue(null);

    // Simulate a request without a request body (e.g., no filters)
    req.body = {};

    await getProductionYears(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Production years not found' });
  });

  it('should respond with a message for defaultSeries', async () => {
    await defaultSeries(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ msg: 'API Series Working' });
  });
});
