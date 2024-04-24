import { Request, Response } from '../../../../src/helpers/middle.helper';
import {
  defaultSeries,
  getProductions,
  getProductionYears,
} from '../../../../src/app/series/application/series.controller';
import { getProduction, getProductionYear } from '../../../../src/app/series/domain/services/index';

jest.mock('../../../../src/app/series/domain/services/index'); // Mock the services

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

    // Mock the getProduction function to resolve with productions
    (getProduction as jest.Mock).mockResolvedValue(productions);

    // Simulate a request with a request body (e.g., filters)
    req.body = { category: 'Action' };

    await getProductions(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(productions);
  });

  it('should respond with a 404 error for getProductions when productions are not found', async () => {
    // Mock the getProduction function to resolve with null (productions not found)
    (getProduction as jest.Mock).mockResolvedValue(null);

    // Simulate a request with a request body (e.g., filters)
    req.body = { category: 'Drama' };

    await getProductions(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Productions not found' });
  });

  it('should respond with production years when getProductionYear succeeds', async () => {
    // Define a sample years array for testing
    const years = [2020, 2021, 2022];

    // Mock the getProductionYear function to resolve with years
    (getProductionYear as jest.Mock).mockResolvedValue(years);

    // Simulate a request without a request body (e.g., no filters)
    req.body = {};

    await getProductionYears(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(years);
  });

  it('should respond with a 404 error for getProductionYears when production years are not found', async () => {
    // Mock the getProductionYear function to resolve with null (production years not found)
    (getProductionYear as jest.Mock).mockResolvedValue(null);

    // Simulate a request without a request body (e.g., no filters)
    req.body = {};

    await getProductionYears(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Production years not found' });
  });
});
