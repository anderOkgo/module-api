import { Request, Response } from '../../../../src/helpers/middle.helper';
import {
  defaultSeries,
  getProductions,
  getProductionYears,
} from '../../../../src/app/series/application/series.controller';
import {
  getProductionsService,
  getProductionYearsService,
} from '../../../../src/app/series/domain/services/index';
import { validateProduction } from '../../../../src/app/series/application/series.validation';

jest.mock('../../../../src/app/series/domain/services/index'); // Mock the services
jest.mock('../../../../src/app/series/application/series.validation'); // Mock the validation

describe('Series Controller', () => {
  const req: Partial<Request> = {};
  const res: Partial<Response> = {
    json: jest.fn(),
    status: jest.fn(() => res as Response), // Type assertion here
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should respond with a message for defaultSeries', async () => {
    await defaultSeries(req as Request, res as Response);

    // Check if the response JSON has been called correctly with the expected message
    expect(res.json).toHaveBeenCalledWith({ msg: 'API Series Working' });
  });

  it('should respond with productions when getProduction succeeds', async () => {
    // Define a sample productions object for testing
    const productions = [{ title: 'Series 1' }, { title: 'Series 2' }];

    // Mock the validation to pass
    (validateProduction as jest.Mock).mockReturnValue({ valid: true, result: {} });

    // Mock the getProductionsService function to resolve with productions
    (getProductionsService as jest.Mock).mockResolvedValue(productions);

    // Simulate a request with a request body (e.g., filters)
    req.body = { category: 'Action' };

    await getProductions(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(productions);
  });

  it('should respond with a 404 error for getProductions when productions are not found', async () => {
    // Mock the validation to pass
    (validateProduction as jest.Mock).mockReturnValue({ valid: true, result: {} });

    // Mock the getProductionsService function to resolve with error
    (getProductionsService as jest.Mock).mockResolvedValue({ errorSys: true, message: 'Productions not found' });

    // Simulate a request with a request body (e.g., filters)
    req.body = { category: 'Drama' };

    await getProductions(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith('Productions not found');
  });

  it('should respond with production years when getProductionYear succeeds', async () => {
    // Define a sample years array for testing
    const years = [2020, 2021, 2022];

    // Mock the getProductionYearsService function to resolve with years
    (getProductionYearsService as jest.Mock).mockResolvedValue(years);

    // Simulate a request without a request body (e.g., no filters)
    req.body = {};

    await getProductionYears(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(years);
  });

  it('should respond with a 404 error for getProductionYears when production years are not found', async () => {
    // Mock the getProductionYearsService function to resolve with error
    (getProductionYearsService as jest.Mock).mockResolvedValue({
      errorSys: true,
      message: 'Production years not found',
    });

    // Simulate a request without a request body (e.g., no filters)
    req.body = {};

    await getProductionYears(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith('Production years not found');
  });
});
