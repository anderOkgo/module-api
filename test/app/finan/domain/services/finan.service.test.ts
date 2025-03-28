import { FinanRepository } from '../../../../../src/app/finan/infrastructure/repositories/finan.repository';
import { getInitialLoad, putMovement } from '../../../../../src/app/finan/domain/services/finan.service';
import Movement from '../../../../../src/app/finan/domain/models/Movement';

// Manually mock FinanRepository
const mockFinanRepository: FinanRepository = {
  getInitialLoad: jest.fn(),
  putMovement: jest.fn(),
  updateMovementById: jest.fn(),
  deleteMovementById: jest.fn(),
};

describe('Finan Services', () => {
  // Reset mock function calls before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call getInitialLoad when getInitialLoad is called', () => {
    const totalBankService = getInitialLoad(mockFinanRepository);
    const data: any = { data: 1 };

    totalBankService(data);

    expect(mockFinanRepository.getInitialLoad).toHaveBeenCalledWith(data);
  });

  it('should call putMovement when putMovement is called', () => {
    const movementService = putMovement(mockFinanRepository);
    const movement: Movement = {
      movement_name: 'string',
      movement_val: 100,
      movement_date: 'string',
      movement_type: 1,
      movement_tag: 'string',
      currency: 'USD',
    };

    movementService(movement);

    expect(mockFinanRepository.putMovement).toHaveBeenCalledWith(movement);
  });
});
