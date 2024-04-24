import { Request, Response } from '../../../../src/helpers/middle.helper';
import {
  defaultFInan,
  getInitialLoads,
  putMovements,
} from '../../../../src/app/finan/application/finan.controller';
import { getInitialLoad, putMovement } from '../../../../src/app/finan/domain/services/index';

jest.mock('../../../../src/app/finan/domain/services/index'); // Mock the services

describe('Finan Controller', () => {
  const req: Partial<Request> = {};
  const res: Partial<Response> = {
    json: jest.fn(),
    status: jest.fn(() => res as Response), // Type assertion here
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should respond with a message for defaultFInan', async () => {
    await defaultFInan(req as Request, res as Response);

    // Check if the response JSON has been called correctly with the expected message
    expect(res.json).toHaveBeenCalledWith({ msg: 'API Finan Working' });
  });

  it('should respond with TotalBank when getInitialLoad succeeds', async () => {
    // Define a sample TotalBank object for testing
    const TotalBank = { balance: 1000 };

    // Mock the getInitialLoad function to resolve with TotalBank
    (getInitialLoad as jest.Mock).mockResolvedValue(TotalBank);

    // Simulate a request with a date in the request body
    req.body = { date: '2023-01-01' };

    await getInitialLoads(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(TotalBank);
  });

  it('should respond with a 404 error for getInitialLoads when TotalBank is not found', async () => {
    // Mock the getInitialLoad function to resolve with null (TotalBank not found)
    (getInitialLoad as jest.Mock).mockResolvedValue(null);

    // Simulate a request with a date in the request body
    req.body = { date: '2023-01-01' };

    await getInitialLoads(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'TotalBank not found' });
  });

  it('should respond with a successful message for putMovements when Movement is successful', async () => {
    // Mock the putMovement function to resolve with success
    (putMovement as jest.Mock).mockResolvedValue(true);

    // Simulate a request with a Movement object in the request body
    req.body = { amount: 100, description: 'Deposit' };

    await putMovements(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'successful' });
  });

  it('should respond with a 404 error for putMovements when Movement is not successful', async () => {
    // Mock the putMovement function to resolve with false (Movement not successful)
    (putMovement as jest.Mock).mockResolvedValue(false);

    // Simulate a request with a Movement object in the request body
    req.body = { amount: 100, description: 'Withdrawal' };

    await putMovements(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Movement not done' });
  });
});
