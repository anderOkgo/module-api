import { FinanRepository } from '../../../../../src/modules/finan/infrastructure/repositories/finan.repository';
import {
  getInitialLoad,
  putMovement,
  updateMovement,
  deleteMovement,
} from '../../../../../src/modules/finan/domain/services/finan.service';
import Movement from '../../../../../src/modules/finan/domain/models/Movement';

// Mock FinanRepository
const mockFinanRepository: FinanRepository = {
  getInitialLoad: jest.fn(),
  putMovement: jest.fn(),
  updateMovementById: jest.fn(),
  deleteMovementById: jest.fn(),
};

describe('Finan Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInitialLoad', () => {
    it('should call repository getInitialLoad with provided data', () => {
      const service = getInitialLoad(mockFinanRepository);
      const testData = { someData: 'test' };

      service(testData);

      expect(mockFinanRepository.getInitialLoad).toHaveBeenCalledWith(testData);
    });
  });

  describe('putMovement', () => {
    it('should call repository putMovement with provided movement', () => {
      const service = putMovement(mockFinanRepository);
      const testMovement: Movement = {
        movement_name: 'Test Movement',
        movement_val: 100,
        movement_type: 1,
        movement_date: '2024-03-20',
        movement_tag: 'salary',
        currency: 'USD',
      };

      service(testMovement);

      expect(mockFinanRepository.putMovement).toHaveBeenCalledWith(testMovement);
    });
  });

  describe('updateMovement', () => {
    it('should call repository updateMovementById with provided id and movement', () => {
      const service = updateMovement(mockFinanRepository);
      const testId = 1;
      const testMovement: Movement = {
        movement_name: 'Updated Movement',
        movement_val: 200,
        movement_type: 2,
        movement_date: '2024-03-21',
        movement_tag: 'food',
        currency: 'EUR',
        id: testId,
      };

      service(testId, testMovement);

      expect(mockFinanRepository.updateMovementById).toHaveBeenCalledWith(testId, testMovement);
    });
  });

  describe('deleteMovement', () => {
    it('should call repository deleteMovementById with provided id and username', () => {
      const service = deleteMovement(mockFinanRepository);
      const testId = 1;
      const testUsername = 'testUser';

      service(testId, testUsername);

      expect(mockFinanRepository.deleteMovementById).toHaveBeenCalledWith(testId, testUsername);
    });
  });
});
