import { Request, Response, NextFunction } from '../../../../src/helpers/middle.helper';
import {
  defaultFInan,
  getInitialLoad,
  putMovement,
  updateMovement,
  deleteMovement,
} from '../../../../src/app/finan/application/finan.controller';

import {
  validateGetInitialLoad,
  validatePutMovement,
  validateDeleteMovement,
  validateUpdateMovements,
} from '../../../../src/app/finan/application/finan.validations';

// Mocking the dependencies
jest.mock('../../../../src/app/finan/domain/services/index', () => ({
  getInitialLoadService: jest.fn(),
  putMovementService: jest.fn(),
  updateMovementService: jest.fn(),
  deleteMovementService: jest.fn(),
}));
jest.mock('../../../../src/app/finan/application/finan.validations');

describe('Finan Controller', () => {
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

  it('should respond with a message for defaultFInan', async () => {
    await defaultFInan(res as Response);

    expect(res.json).toHaveBeenCalledWith({ msg: 'API Finan Working' });
  });

  it('should respond with TotalBank when validation passes', async () => {
    const requestBody = { date: '2023-01-01' };
    req.body = requestBody;

    // Mock validation to pass
    (validateGetInitialLoad as jest.Mock).mockReturnValue({ isValid: true });
    // Mock service to return data
    const { getInitialLoadService } = require('../../../../src/app/finan/domain/services/index');
    (getInitialLoadService as jest.Mock).mockResolvedValue({ total: 1000 });

    await getInitialLoad(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ total: 1000 });
  });

  it('should respond with 404 error when TotalBank is not found', async () => {
    const requestBody = { date: '2023-01-01' };
    req.body = requestBody;

    // Mock validation to pass
    (validateGetInitialLoad as jest.Mock).mockReturnValue({ isValid: true });
    // Mock service to return null
    const { getInitialLoadService } = require('../../../../src/app/finan/domain/services/index');
    (getInitialLoadService as jest.Mock).mockResolvedValue(null);

    await getInitialLoad(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'TotalBank not found' });
  });

  it('should respond with 400 error when validation fails', async () => {
    const requestBody = { date: 'invalid-date' };
    req.body = requestBody;

    // Mock validation to fail
    (validateGetInitialLoad as jest.Mock).mockReturnValue({ isValid: false, error: 'Invalid date' });

    await getInitialLoad(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ isValid: false, error: 'Invalid date' });
  });

  // Similar tests for putMovements, updateMovements, and deleteMovements
});
