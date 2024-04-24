import { FinanRepository } from '../../../../../src/app/finan/infrastructure/repositories/finan.repository';
import {
  getInitialLoadService,
  putMovementService,
} from '../../../../../src/app/finan/domain/services/finan.service';
import Movement from '../../../../../src/app/finan/domain/models/Movement';

// Manually mock FinanRepository
const mockFinanRepository: FinanRepository = {
  getInitialLoadRepository: jest.fn(),
  putMovementRepository: jest.fn(),
  updateMovementByIdRepository: jest.fn(),
  deleteMovementByIdRepository: jest.fn(),
};

describe('Finan Services', () => {
  // Reset mock function calls before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call getInitialLoadRepository when getInitialLoadService is called', () => {
    const totalBankService = getInitialLoadService(mockFinanRepository);
    const data: any = { data: 1 };

    totalBankService(data);

    expect(mockFinanRepository.getInitialLoadRepository).toHaveBeenCalledWith(data);
  });

  it('should call putMovementRepository when putMovement is called', () => {
    const movementService = putMovementService(mockFinanRepository);
    const movement: Movement = {
      name: 'string',
      val: 'string',
      type: 'string',
      date: 'string',
      tag: 'string',
    };

    movementService(movement);

    expect(mockFinanRepository.putMovementRepository).toHaveBeenCalledWith(movement);
  });
});
