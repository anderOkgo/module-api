import { FinanRepository } from '../../../../../src/app/finan/infrastructure/repositories/finan.repository';
import { getTotalBank, putMoviment } from '../../../../../src/app/finan/domain/services/finan.service';
import Production from '../../../../../src/app/finan/domain/models/Prodution';

// Manually mock FinanRepository
const mockFinanRepository: FinanRepository = {
  getTotalBank: jest.fn(),
  putMoviment: jest.fn(),
};

describe('Finan Services', () => {
  // Reset mock function calls before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call getTotalBank when getTotalBankService is called', () => {
    const totalBankService = getTotalBank(mockFinanRepository);
    const data: any = { data: 1 };

    totalBankService(data);

    expect(mockFinanRepository.getTotalBank).toHaveBeenCalledWith(data);
  });

  it('should call putMoviment when putMovimentService is called', () => {
    const movimentService = putMoviment(mockFinanRepository);
    const moviment: Production = {
      name: 'string',
      val: 'string',
      type: 'string',
    };

    movimentService(moviment);

    expect(mockFinanRepository.putMoviment).toHaveBeenCalledWith(moviment);
  });
});
