import { Request, Response } from 'express';
import { FinanController } from '../../../../src/modules/finan/infrastructure/controllers/finan.controller';
import { GetInitialLoadUseCase } from '../../../../src/modules/finan/application/use-cases/get-initial-load.use-case';
import { PutMovementUseCase } from '../../../../src/modules/finan/application/use-cases/put-movement.use-case';
import { UpdateMovementUseCase } from '../../../../src/modules/finan/application/use-cases/update-movement.use-case';
import { DeleteMovementUseCase } from '../../../../src/modules/finan/application/use-cases/delete-movement.use-case';

// Mock the use cases
const mockGetInitialLoadUseCase = {
  execute: jest.fn(),
} as jest.Mocked<GetInitialLoadUseCase>;

const mockPutMovementUseCase = {
  execute: jest.fn(),
} as jest.Mocked<PutMovementUseCase>;

const mockUpdateMovementUseCase = {
  execute: jest.fn(),
} as jest.Mocked<UpdateMovementUseCase>;

const mockDeleteMovementUseCase = {
  execute: jest.fn(),
} as jest.Mocked<DeleteMovementUseCase>;

describe('FinanController', () => {
  let finanController: FinanController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    finanController = new FinanController(
      mockGetInitialLoadUseCase,
      mockPutMovementUseCase,
      mockUpdateMovementUseCase,
      mockDeleteMovementUseCase
    );
    req = {
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res as Response),
    };
    jest.clearAllMocks();
  });

  it('should get initial load data successfully', async () => {
    const requestBody = { currency: 'USD', username: 'testuser' };
    const expectedData = {
      movements: [],
      balance: [],
      yearlyBalance: [],
      movementTag: [],
      totalDay: [],
      balanceUntilDate: [],
      totalBank: [],
    };

    mockGetInitialLoadUseCase.execute.mockResolvedValue(expectedData);
    req.body = requestBody;

    await finanController.getInitialLoad(req as Request, res as Response);

    expect(mockGetInitialLoadUseCase.execute).toHaveBeenCalledWith(requestBody);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Initial load data retrieved successfully',
      data: expectedData,
    });
  });

  it('should handle internal server error during getInitialLoad', async () => {
    const requestBody = { currency: 'USD', username: 'testuser' };

    mockGetInitialLoadUseCase.execute.mockRejectedValue(new Error('Database error'));
    req.body = requestBody;

    await finanController.getInitialLoad(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: 'Internal server error',
    });
  });

  it('should create movement successfully', async () => {
    const movement = {
      movement_name: 'test',
      movement_val: 10,
      movement_date: '2023-09-25',
      movement_type: 1,
      movement_tag: 'testtag',
      currency: 'USD',
      username: 'testuser',
    };

    const expectedResponse = {
      success: true,
      message: 'Movement created successfully',
      data: { id: 1, ...movement },
    };

    mockPutMovementUseCase.execute.mockResolvedValue(expectedResponse);
    req.body = movement;

    await finanController.putMovement(req as Request, res as Response);

    expect(mockPutMovementUseCase.execute).toHaveBeenCalledWith(movement);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: expectedResponse.message,
      data: expectedResponse.data,
    });
  });

  it('should return error when movement creation fails', async () => {
    const movement = {
      movement_name: 'test',
      movement_val: 10,
      movement_date: '2023-09-25',
      movement_type: 1,
      movement_tag: 'testtag',
      currency: 'USD',
      username: 'testuser',
    };

    const errorResponse = {
      success: false,
      message: 'Movement creation failed',
    };

    mockPutMovementUseCase.execute.mockResolvedValue(errorResponse);
    req.body = movement;

    await finanController.putMovement(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: errorResponse.message,
    });
  });

  it('should handle internal server error during putMovement', async () => {
    const movement = {
      movement_name: 'test',
      movement_val: 10,
      movement_date: '2023-09-25',
      movement_type: 1,
      movement_tag: 'testtag',
      currency: 'USD',
      username: 'testuser',
    };

    mockPutMovementUseCase.execute.mockRejectedValue(new Error('Database error'));
    req.body = movement;

    await finanController.putMovement(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: 'Internal server error',
    });
  });

  it('should update movement successfully', async () => {
    const movementData = {
      movement_name: 'updated test',
      movement_val: 20,
      movement_date: '2023-09-25',
      movement_type: 1,
      movement_tag: 'updatedtag',
      currency: 'USD',
      username: 'testuser',
    };

    const expectedResponse = {
      success: true,
      message: 'Movement updated successfully',
      data: { id: 1, ...movementData },
    };

    mockUpdateMovementUseCase.execute.mockResolvedValue(expectedResponse);
    req.params = { id: '1' };
    req.body = movementData;

    await finanController.updateMovement(req as Request, res as Response);

    expect(mockUpdateMovementUseCase.execute).toHaveBeenCalledWith(1, movementData, 'testuser');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: expectedResponse.message,
      data: expectedResponse.data,
    });
  });

  it('should delete movement successfully', async () => {
    const expectedResponse = {
      success: true,
      message: 'Movement deleted successfully',
    };

    mockDeleteMovementUseCase.execute.mockResolvedValue(expectedResponse);
    req.params = { id: '1' };
    req.body = { username: 'testuser' };

    await finanController.deleteMovement(req as Request, res as Response);

    expect(mockDeleteMovementUseCase.execute).toHaveBeenCalledWith(1, 'testuser');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: expectedResponse.message,
    });
  });
});
