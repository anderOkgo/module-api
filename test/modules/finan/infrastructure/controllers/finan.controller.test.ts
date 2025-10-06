import { Request, Response } from 'express';
import { FinanController } from '../../../../../src/modules/finan/infrastructure/controllers/finan.controller';
import { GetInitialLoadUseCase } from '../../../../../src/modules/finan/application/use-cases/get-initial-load.use-case';
import { PutMovementUseCase } from '../../../../../src/modules/finan/application/use-cases/put-movement.use-case';
import { UpdateMovementUseCase } from '../../../../../src/modules/finan/application/use-cases/update-movement.use-case';
import { DeleteMovementUseCase } from '../../../../../src/modules/finan/application/use-cases/delete-movement.use-case';
import {
  validatePutMovement,
  validateGetInitialLoad,
} from '../../../../../src/modules/finan/infrastructure/validation/finan.validation';

// Mock the validation functions
jest.mock('../../../../../src/modules/finan/infrastructure/validation/finan.validation', () => ({
  validatePutMovement: jest.fn(),
  validateGetInitialLoad: jest.fn(),
}));

// Mock the use cases
const mockGetInitialLoadUseCase = {
  execute: jest.fn(),
} as any;

const mockPutMovementUseCase = {
  execute: jest.fn(),
} as any;

const mockUpdateMovementUseCase = {
  execute: jest.fn(),
} as any;

const mockDeleteMovementUseCase = {
  execute: jest.fn(),
} as any;

const mockValidateGetInitialLoad = validateGetInitialLoad as jest.MockedFunction<typeof validateGetInitialLoad>;
const mockValidatePutMovement = validatePutMovement as jest.MockedFunction<typeof validatePutMovement>;

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
      params: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res as Response),
    };
    jest.clearAllMocks();

    // Default validation mocks - pass validation by default
    mockValidateGetInitialLoad.mockReturnValue({ error: false, errors: [] });
    mockValidatePutMovement.mockReturnValue({ error: false, errors: [] });
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
      totalExpenseDay: [],
      totalBalance: [],
      monthlyBalance: [],
      monthlyExpensesUntilDay: [],
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
      data: {
        id: 1,
        name: 'test',
        value: 10,
        date_movement: '2023-09-25',
        type_source_id: 1,
        tag: 'testtag',
        currency: 'USD',
        user: 'testuser',
      },
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

    expect(mockPutMovementUseCase.execute).toHaveBeenCalledWith(movement);
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
      data: {
        id: 1,
        name: 'updated test',
        value: 20,
        date_movement: '2023-09-25',
        type_source_id: 1,
        tag: 'updatedtag',
        currency: 'USD',
        user: 'testuser',
      },
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

  // Validation failure tests
  describe('Validation failures', () => {
    it('should return validation error for getInitialLoad', async () => {
      const validationErrors = ['Currency cannot be empty'];
      mockValidateGetInitialLoad.mockReturnValue({ error: true, errors: validationErrors });

      req.body = { currency: '' };

      await finanController.getInitialLoad(req as Request, res as Response);

      expect(mockValidateGetInitialLoad).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(validationErrors);
      expect(mockGetInitialLoadUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return validation error for putMovement', async () => {
      const validationErrors = ['Movement name is required'];
      mockValidatePutMovement.mockReturnValue({ error: true, errors: validationErrors });

      req.body = { movement_name: '' };

      await finanController.putMovement(req as Request, res as Response);

      expect(mockValidatePutMovement).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(validationErrors);
      expect(mockPutMovementUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return validation error for updateMovement', async () => {
      const validationErrors = ['Movement name is required'];
      mockValidatePutMovement.mockReturnValue({ error: true, errors: validationErrors });

      req.body = { movement_name: '' };
      req.params = { id: '1' };

      await finanController.updateMovement(req as Request, res as Response);

      expect(mockValidatePutMovement).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(validationErrors);
      expect(mockUpdateMovementUseCase.execute).not.toHaveBeenCalled();
    });
  });

  // Error handling tests
  describe('Error handling', () => {
    it('should handle updateMovement use case failure', async () => {
      const errorResponse = {
        success: false,
        message: 'Movement not found',
      };

      mockUpdateMovementUseCase.execute.mockResolvedValue(errorResponse);
      req.params = { id: '1' };
      req.body = {
        movement_name: 'updated test',
        username: 'testuser',
      };

      await finanController.updateMovement(req as Request, res as Response);

      expect(mockUpdateMovementUseCase.execute).toHaveBeenCalledWith(1, req.body, 'testuser');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Movement not found',
      });
    });

    it('should handle updateMovement internal server error', async () => {
      mockUpdateMovementUseCase.execute.mockRejectedValue(new Error('Database connection failed'));
      req.params = { id: '1' };
      req.body = {
        movement_name: 'updated test',
        username: 'testuser',
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await finanController.updateMovement(req as Request, res as Response);

      expect(consoleSpy).toHaveBeenCalledWith('Error in updateMovement:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Internal server error',
      });

      consoleSpy.mockRestore();
    });

    it('should handle deleteMovement use case failure', async () => {
      const errorResponse = {
        success: false,
        message: 'Movement not found',
      };

      mockDeleteMovementUseCase.execute.mockResolvedValue(errorResponse);
      req.params = { id: '1' };
      req.body = { username: 'testuser' };

      await finanController.deleteMovement(req as Request, res as Response);

      expect(mockDeleteMovementUseCase.execute).toHaveBeenCalledWith(1, 'testuser');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Movement not found',
      });
    });

    it('should handle deleteMovement internal server error', async () => {
      mockDeleteMovementUseCase.execute.mockRejectedValue(new Error('Database connection failed'));
      req.params = { id: '1' };
      req.body = { username: 'testuser' };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await finanController.deleteMovement(req as Request, res as Response);

      expect(consoleSpy).toHaveBeenCalledWith('Error in deleteMovement:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Internal server error',
      });

      consoleSpy.mockRestore();
    });

    it('should handle non-Error objects in updateMovement', async () => {
      mockUpdateMovementUseCase.execute.mockRejectedValue('String error');
      req.params = { id: '1' };
      req.body = {
        movement_name: 'updated test',
        username: 'testuser',
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await finanController.updateMovement(req as Request, res as Response);

      expect(consoleSpy).toHaveBeenCalledWith('Error in updateMovement:', 'String error');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Internal server error',
      });

      consoleSpy.mockRestore();
    });

    it('should handle non-Error objects in deleteMovement', async () => {
      mockDeleteMovementUseCase.execute.mockRejectedValue('String error');
      req.params = { id: '1' };
      req.body = { username: 'testuser' };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await finanController.deleteMovement(req as Request, res as Response);

      expect(consoleSpy).toHaveBeenCalledWith('Error in deleteMovement:', 'String error');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Internal server error',
      });

      consoleSpy.mockRestore();
    });
  });

  // Edge cases and parameter handling
  describe('Edge cases and parameter handling', () => {
    it('should handle updateMovement with default username when not provided', async () => {
      const expectedResponse = {
        success: true,
        message: 'Movement updated successfully',
        data: {
          id: 1,
          name: 'updated test',
          value: 0,
          date_movement: '',
          type_source_id: 0,
          tag: '',
          currency: '',
          user: '',
        },
      };

      mockUpdateMovementUseCase.execute.mockResolvedValue(expectedResponse);
      req.params = { id: '1' };
      req.body = { movement_name: 'updated test' }; // No username

      await finanController.updateMovement(req as Request, res as Response);

      expect(mockUpdateMovementUseCase.execute).toHaveBeenCalledWith(1, req.body, 'default');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: expectedResponse.message,
        data: expectedResponse.data,
      });
    });

    it('should handle deleteMovement with default username when not provided', async () => {
      const expectedResponse = {
        success: true,
        message: 'Movement deleted successfully',
      };

      mockDeleteMovementUseCase.execute.mockResolvedValue(expectedResponse);
      req.params = { id: '1' };
      req.body = {}; // No username

      await finanController.deleteMovement(req as Request, res as Response);

      expect(mockDeleteMovementUseCase.execute).toHaveBeenCalledWith(1, 'default');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: expectedResponse.message,
      });
    });

    it('should handle updateMovement with empty username', async () => {
      const expectedResponse = {
        success: true,
        message: 'Movement updated successfully',
        data: {
          id: 1,
          name: 'updated test',
          value: 0,
          date_movement: '',
          type_source_id: 0,
          tag: '',
          currency: '',
          user: '',
        },
      };

      mockUpdateMovementUseCase.execute.mockResolvedValue(expectedResponse);
      req.params = { id: '1' };
      req.body = {
        movement_name: 'updated test',
        username: '', // Empty username
      };

      await finanController.updateMovement(req as Request, res as Response);

      expect(mockUpdateMovementUseCase.execute).toHaveBeenCalledWith(1, req.body, 'default');
    });

    it('should handle deleteMovement with empty username', async () => {
      const expectedResponse = {
        success: true,
        message: 'Movement deleted successfully',
      };

      mockDeleteMovementUseCase.execute.mockResolvedValue(expectedResponse);
      req.params = { id: '1' };
      req.body = { username: '' }; // Empty username

      await finanController.deleteMovement(req as Request, res as Response);

      expect(mockDeleteMovementUseCase.execute).toHaveBeenCalledWith(1, 'default');
    });

    it('should handle invalid ID parameter in updateMovement', async () => {
      req.params = { id: 'invalid' };
      req.body = {
        movement_name: 'updated test',
        username: 'testuser',
      };

      await finanController.updateMovement(req as Request, res as Response);

      expect(mockUpdateMovementUseCase.execute).toHaveBeenCalledWith(NaN, req.body, 'testuser');
    });

    it('should handle invalid ID parameter in deleteMovement', async () => {
      req.params = { id: 'invalid' };
      req.body = { username: 'testuser' };

      await finanController.deleteMovement(req as Request, res as Response);

      expect(mockDeleteMovementUseCase.execute).toHaveBeenCalledWith(NaN, 'testuser');
    });

    it('should handle missing params in updateMovement', async () => {
      req.params = {}; // No id
      req.body = {
        movement_name: 'updated test',
        username: 'testuser',
      };

      await finanController.updateMovement(req as Request, res as Response);

      expect(mockUpdateMovementUseCase.execute).toHaveBeenCalledWith(NaN, req.body, 'testuser');
    });

    it('should handle missing params in deleteMovement', async () => {
      req.params = {}; // No id
      req.body = { username: 'testuser' };

      await finanController.deleteMovement(req as Request, res as Response);

      expect(mockDeleteMovementUseCase.execute).toHaveBeenCalledWith(NaN, 'testuser');
    });
  });

  // Additional success scenarios
  describe('Additional success scenarios', () => {
    it('should handle getInitialLoad with complex data structure', async () => {
      const requestBody = { currency: 'EUR', username: 'testuser' };
      const complexData = {
        movements: [
          { id: 1, name: 'Salary', amount: 5000 },
          { id: 2, name: 'Rent', amount: -1200 },
        ],
        balance: [{ date: '2023-01-01', amount: 3800 }],
        yearlyBalance: [{ year: 2023, amount: 45600 }],
        movementTag: ['salary', 'rent'],
        totalDay: [{ day: 'Monday', total: 1000 }],
        balanceUntilDate: [{ date: '2023-12-31', balance: 50000 }],
        totalBank: [{ bank: 'Chase', total: 25000 }],
        totalExpenseDay: [{ day: '2023-01-01', total: 500 }],
        totalBalance: [{ total: 3800 }],
        monthlyBalance: [{ month: '2023-01', balance: 3800 }],
        monthlyExpensesUntilDay: [{ day: '2023-01-15', expenses: 250 }],
      };

      mockGetInitialLoadUseCase.execute.mockResolvedValue(complexData);
      req.body = requestBody;

      await finanController.getInitialLoad(req as Request, res as Response);

      expect(mockGetInitialLoadUseCase.execute).toHaveBeenCalledWith(requestBody);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Initial load data retrieved successfully',
        data: complexData,
      });
    });

    it('should handle putMovement with minimal required fields', async () => {
      const minimalMovement = {
        movement_name: 'test',
        movement_val: 10,
        movement_date: '2023-09-25',
        movement_type: 1,
        currency: 'USD',
        username: 'testuser',
      };

      const expectedResponse = {
        success: true,
        message: 'Movement created successfully',
        data: {
          id: 1,
          name: 'test',
          value: 10,
          date_movement: '2023-09-25',
          type_source_id: 1,
          tag: '',
          currency: 'USD',
          user: 'testuser',
        },
      };

      mockPutMovementUseCase.execute.mockResolvedValue(expectedResponse);
      req.body = minimalMovement;

      await finanController.putMovement(req as Request, res as Response);

      expect(mockPutMovementUseCase.execute).toHaveBeenCalledWith(minimalMovement);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: expectedResponse.message,
        data: expectedResponse.data,
      });
    });
  });
});
