import { Request, Response } from '../../../../src/helpers/middle.helper';
import { defaultFInan, getInitialLoad, putMovement } from '../../../../src/app/finan/application/finan.controller';
import { getInitialLoadService, putMovementService } from '../../../../src/app/finan/domain/services/index';

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

  it('should respond with TotalBank when getInitialLoadService succeeds', async () => {
    // Define a sample TotalBank object for testing
    const TotalBank = { balance: 1000 };

    // Mock the getInitialLoadService function to resolve with TotalBank
    (getInitialLoadService as jest.Mock).mockResolvedValue(TotalBank);

    // Simulate a request with a date in the request body
    req.body = { date: '2023-01-01' };

    await getInitialLoad(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(TotalBank);
  });

  it('should respond with a 404 error for getInitialLoad when TotalBank is not found', async () => {
    // Mock the getInitialLoadService function to resolve with null (TotalBank not found)
    (getInitialLoadService as jest.Mock).mockResolvedValue(null);

    // Simulate a request with a date in the request body
    req.body = { date: '2023-01-01' };

    await getInitialLoad(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'TotalBank not found' });
  });

  it('should respond with a successful message for putMovement when Movement is successful', async () => {
    // Mock the putMovementService function to resolve with success
    (putMovementService as jest.Mock).mockResolvedValue(true);

    // Simulate a request with a Movement object in the request body
    req.body = { amount: 100, description: 'Deposit' };

    await putMovement(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'successful' });
  });

  it('should respond with a 404 error for putMovement when Movement is not successful', async () => {
    // Mock the putMovementService function to resolve with false (Movement not successful)
    (putMovementService as jest.Mock).mockResolvedValue(false);

    // Simulate a request with a Movement object in the request body
    req.body = { amount: 100, description: 'Withdrawal' };

    await putMovement(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Movement not done' });
  });
});
