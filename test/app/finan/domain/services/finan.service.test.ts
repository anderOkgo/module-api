import { FinanRepository } from '../../../../../src/app/finan/infrastructure/repositories/finan.repository';
import { getInitialLoad, putMovement } from '../../../../../src/app/finan/domain/services/finan.service';
import Production from '../../../../../src/app/finan/domain/models/Prodution';

// Manually mock FinanRepository
const mockFinanRepository: FinanRepository = {
  getInitialLoad: jest.fn(),
  putMovement: jest.fn(),
};

describe('Finan Services', () => {
  // Reset mock function calls before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call getInitialLoad when getInitialLoadService is called', () => {
    const totalBankService = getInitialLoad(mockFinanRepository);
    const data: any = { data: 1 };

    totalBankService(data);

    expect(mockFinanRepository.getInitialLoad).toHaveBeenCalledWith(data);
  });

  it('should call putMovement when putMovementService is called', () => {
    const movementService = putMovement(mockFinanRepository);
    const movement: Production = {
      name: 'string',
      val: 'string',
      type: 'string',
    };

    movementService(movement);

    expect(mockFinanRepository.putMovement).toHaveBeenCalledWith(movement);
  });
});
