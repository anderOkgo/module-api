import { Request, Response } from '../../../../src/helpers/middle.helper';
import { defaultFInan, getTotalBank, putMoviment } from '../../../../src/app/finan/application/finan.controller';
import { getTotalBankService, putMovimentService } from '../../../../src/app/finan/domain/services/index';

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

  it('should respond with TotalBank when getTotalBankService succeeds', async () => {
    // Define a sample TotalBank object for testing
    const TotalBank = { balance: 1000 };

    // Mock the getTotalBankService function to resolve with TotalBank
    (getTotalBankService as jest.Mock).mockResolvedValue(TotalBank);

    // Simulate a request with a date in the request body
    req.body = { date: '2023-01-01' };

    await getTotalBank(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(TotalBank);
  });

  it('should respond with a 404 error for getTotalBank when TotalBank is not found', async () => {
    // Mock the getTotalBankService function to resolve with null (TotalBank not found)
    (getTotalBankService as jest.Mock).mockResolvedValue(null);

    // Simulate a request with a date in the request body
    req.body = { date: '2023-01-01' };

    await getTotalBank(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'TotalBank not found' });
  });

  it('should respond with a successful message for putMoviment when Moviment is successful', async () => {
    // Mock the putMovimentService function to resolve with success
    (putMovimentService as jest.Mock).mockResolvedValue(true);

    // Simulate a request with a Moviment object in the request body
    req.body = { amount: 100, description: 'Deposit' };

    await putMoviment(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'successful' });
  });

  it('should respond with a 404 error for putMoviment when Moviment is not successful', async () => {
    // Mock the putMovimentService function to resolve with false (Moviment not successful)
    (putMovimentService as jest.Mock).mockResolvedValue(false);

    // Simulate a request with a Moviment object in the request body
    req.body = { amount: 100, description: 'Withdrawal' };

    await putMoviment(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Moviment not done' });
  });
});
