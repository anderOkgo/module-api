import { Request, Response } from '../../../../src/infrastructure/middle.helper';
import {
  defaultFInan,
  getInitialLoad,
  putMovement,
} from '../../../../src/modules/finan/application/finan.controller';
import { getInitialLoadService, putMovementService } from '../../../../src/modules/finan/domain/services/index';
import {
  validateGetInitialLoad,
  validatePutMovement,
} from '../../../../src/modules/finan/application/finan.validations';

// Mock the dependencies
jest.mock('../../../../src/modules/finan/domain/services/index', () => ({
  getInitialLoadService: jest.fn(),
  putMovementService: jest.fn(),
}));
jest.mock('../../../../src/modules/finan/application/finan.validations');

describe('Finan Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res as Response),
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should respond with a message for defaultFInan', async () => {
    await defaultFInan(res as Response);

    expect(res.json).toHaveBeenCalledWith({ msg: 'API Finan Working' });
  });

  it('should respond with initial load data when validation passes', async () => {
    const requestBody = { currency: 'USD', username: 'testuser' };
    req.body = requestBody;

    // Mock validation to pass
    (validateGetInitialLoad as jest.Mock).mockReturnValue({ error: false });
    // Mock service to return data
    (getInitialLoadService as jest.Mock).mockResolvedValue({
      movements: [],
      balance: [],
      yearlyBalance: [],
      movementTag: [],
      totalDay: [],
      balanceUntilDate: [],
      totalBank: [],
    });

    await getInitialLoad(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      movements: [],
      balance: [],
      yearlyBalance: [],
      movementTag: [],
      totalDay: [],
      balanceUntilDate: [],
      totalBank: [],
    });
  });

  it('should respond with 400 error when validation fails', async () => {
    const requestBody = { currency: 'INVALID' };
    req.body = requestBody;

    // Mock validation to fail
    (validateGetInitialLoad as jest.Mock).mockReturnValue({ error: true, errors: ['Invalid currency'] });

    await getInitialLoad(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(['Invalid currency']);
  });

  it('should respond with 500 error when service fails', async () => {
    const requestBody = { currency: 'USD', username: 'testuser' };
    req.body = requestBody;

    // Mock validation to pass
    (validateGetInitialLoad as jest.Mock).mockReturnValue({ error: false });
    // Mock service to return error
    (getInitialLoadService as jest.Mock).mockResolvedValue({ errorSys: true, message: 'Database error' });

    await getInitialLoad(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith('Database error');
  });

  it('should respond with success when movement is added', async () => {
    const movement = {
      movement_name: 'test',
      movement_val: 10,
      movement_date: '2023-09-25',
      movement_type: 1,
      movement_tag: 'testtag',
      currency: 'USD',
      username: 'testuser',
    };
    req.body = movement;

    // Mock validation to pass
    (validatePutMovement as jest.Mock).mockReturnValue({ error: false });
    // Mock service to return success
    (putMovementService as jest.Mock).mockResolvedValue({ affectedRows: 1 });

    await putMovement(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ affectedRows: 1 });
  });

  it('should respond with 400 error when movement validation fails', async () => {
    const movement = {
      movement_name: '',
      movement_val: -1,
      movement_date: 'invalid',
      movement_type: 0,
      movement_tag: '',
      currency: 'INVALID',
      username: '',
    };
    req.body = movement;

    // Mock validation to fail
    (validatePutMovement as jest.Mock).mockReturnValue({ error: true, errors: ['Invalid movement'] });

    await putMovement(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(['Invalid movement']);
  });

  it('should respond with 500 error when movement service fails', async () => {
    const movement = {
      movement_name: 'test',
      movement_val: 10,
      movement_date: '2023-09-25',
      movement_type: 1,
      movement_tag: 'testtag',
      currency: 'USD',
      username: 'testuser',
    };
    req.body = movement;

    // Mock validation to pass
    (validatePutMovement as jest.Mock).mockReturnValue({ error: false });
    // Mock service to return error
    (putMovementService as jest.Mock).mockResolvedValue({ errorSys: true, message: 'Database error' });

    await putMovement(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith('Database error');
  });
});
