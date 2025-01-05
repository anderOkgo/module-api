import { Request, Response, NextFunction } from '../../../../src/infrastructure/middle.helper';
import {
  defaultFInan,
  getInitialLoads,
  putMovements,
  updateMovements,
  deleteMovements,
} from '../../../../src/modules/finan/application/finan.controller';
import {
  getInitialLoad,
  putMovement,
  updateMovement,
  deleteMovement,
} from '../../../../src/modules/finan/domain/services/index';

import {
  validateGetInitialLoad,
  validatePutMovement,
  validateDeleteMovement,
  validateUpdateMovements,
} from '../../../../src/modules/finan/application/finan.validations';

// Mocking the dependencies
jest.mock('../../../../src/modules/finan/domain/services/index');
jest.mock('../../../../src/modules/finan/application/finan.validations');

describe('Finan Controller', () => {
  const req: Partial<Request> = {};
  const res: Partial<Response> = {
    json: jest.fn(),
    status: jest.fn(() => res as Response), // Mocking the chainable method
  };
  const next: jest.MockedFunction<any> = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('defaultFInan', () => {
    it('should respond with a message', async () => {
      await defaultFInan(req as Request, res as Response);

      // Check if the response JSON has been called correctly with the expected message
      expect(res.json).toHaveBeenCalledWith({ msg: 'API Finan Working' });
    });
  });

  describe('getInitialLoads', () => {
    it('should respond with TotalBank when validation passes', async () => {
      const requestBody = { date: '2023-01-01' };
      const totalBankData = { balance: 1000 };
      (validateGetInitialLoad as jest.MockedFunction<any>).mockReturnValue({ isValid: true });
      (getInitialLoad as jest.MockedFunction<any>).mockResolvedValue(totalBankData);

      await getInitialLoads(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(totalBankData);
    });

    it('should respond with 404 error when TotalBank is not found', async () => {
      const requestBody = { date: '2023-01-01' };
      (validateGetInitialLoad as jest.MockedFunction<any>).mockReturnValue({ isValid: true });
      (getInitialLoad as jest.MockedFunction<any>).mockResolvedValue(null);

      await getInitialLoads(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'TotalBank Not Found' });
    });

    // Add more test cases as needed
  });

  // Similar tests for putMovements, updateMovements, and deleteMovements
});
