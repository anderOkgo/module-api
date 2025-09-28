import { ProductionService } from '../../../src/modules/productions/domain/services/production.service';
import { ProductionRepository } from '../../../src/modules/productions/infrastructure/repositories/production.repository';
import { ImageHelper } from '../../../src/infrastructure/image.helper';

// Mock del repositorio
const mockProductionRepository: jest.Mocked<ProductionRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  updateImage: jest.fn(),
  search: jest.fn(),
};

// Mock de ImageHelper
jest.mock('../../../src/infrastructure/image.helper', () => ({
  ImageHelper: {
    optimizeImage: jest.fn(),
    saveOptimizedImage: jest.fn(),
    deleteImage: jest.fn(),
    generateUniqueFilename: jest.fn(),
  },
}));

describe('ProductionService', () => {
  let productionService: ProductionService;

  beforeEach(() => {
    jest.clearAllMocks();
    productionService = new ProductionService(mockProductionRepository);
  });

  describe('createProduction', () => {
    const mockProductionData = {
      name: 'Test Production',
      chapter_number: 12,
      year: 2023,
      description: 'Test description',
      qualification: 8.5,
      demography_id: 1,
      visible: true,
    };

    const mockImageBuffer = Buffer.from('mock-image-data');

    it('should create production without image', async () => {
      // Arrange
      const expectedProduction = { id: 1, ...mockProductionData };
      mockProductionRepository.create.mockResolvedValue(expectedProduction);

      // Act
      const result = await productionService.createProduction(mockProductionData);

      // Assert
      expect(mockProductionRepository.create).toHaveBeenCalledWith(mockProductionData);
      expect(result).toEqual(expectedProduction);
    });

    it('should create production with image', async () => {
      // Arrange
      const expectedProduction = { id: 1, ...mockProductionData };
      const optimizedBuffer = Buffer.from('optimized-image-data');
      const filename = 'production_1234567890.jpg';
      const imagePath = '/uploads/productions/production_1234567890.jpg';

      mockProductionRepository.create.mockResolvedValue(expectedProduction);
      mockProductionRepository.updateImage.mockResolvedValue(true);
      (ImageHelper.optimizeImage as jest.Mock).mockResolvedValue(optimizedBuffer);
      (ImageHelper.generateUniqueFilename as jest.Mock).mockReturnValue(filename);
      (ImageHelper.saveOptimizedImage as jest.Mock).mockResolvedValue(imagePath);

      // Act
      const result = await productionService.createProduction(mockProductionData, mockImageBuffer);

      // Assert
      expect(ImageHelper.optimizeImage).toHaveBeenCalledWith(mockImageBuffer);
      expect(ImageHelper.generateUniqueFilename).toHaveBeenCalledWith('production.jpg');
      expect(ImageHelper.saveOptimizedImage).toHaveBeenCalledWith(optimizedBuffer, filename, expect.any(String));
      expect(mockProductionRepository.updateImage).toHaveBeenCalledWith(1, imagePath);
      expect(result).toEqual({ ...expectedProduction, image: imagePath });
    });

    it('should handle errors during production creation', async () => {
      // Arrange
      const error = new Error('Database error');
      mockProductionRepository.create.mockRejectedValue(error);

      // Act & Assert
      await expect(productionService.createProduction(mockProductionData)).rejects.toThrow(
        'Error creating production: Database error'
      );
    });

    it('should handle errors during image processing', async () => {
      // Arrange
      const error = new Error('Image processing error');
      (ImageHelper.optimizeImage as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(productionService.createProduction(mockProductionData, mockImageBuffer)).rejects.toThrow(
        'Error creating production: Image processing error'
      );
    });
  });

  describe('getProductionById', () => {
    it('should return production when found', async () => {
      // Arrange
      const expectedProduction = { id: 1, name: 'Test Production' };
      mockProductionRepository.findById.mockResolvedValue(expectedProduction);

      // Act
      const result = await productionService.getProductionById(1);

      // Assert
      expect(mockProductionRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedProduction);
    });

    it('should return null when not found', async () => {
      // Arrange
      mockProductionRepository.findById.mockResolvedValue(null);

      // Act
      const result = await productionService.getProductionById(999);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockProductionRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(productionService.getProductionById(1)).rejects.toThrow(
        'Error getting production: Database error'
      );
    });
  });

  describe('getAllProductions', () => {
    it('should return all productions with default pagination', async () => {
      // Arrange
      const expectedProductions = [
        { id: 1, name: 'Production 1' },
        { id: 2, name: 'Production 2' },
      ];
      mockProductionRepository.findAll.mockResolvedValue(expectedProductions);

      // Act
      const result = await productionService.getAllProductions();

      // Assert
      expect(mockProductionRepository.findAll).toHaveBeenCalledWith(50, 0);
      expect(result).toEqual(expectedProductions);
    });

    it('should return productions with custom pagination', async () => {
      // Arrange
      const expectedProductions = [{ id: 1, name: 'Production 1' }];
      mockProductionRepository.findAll.mockResolvedValue(expectedProductions);

      // Act
      const result = await productionService.getAllProductions(10, 20);

      // Assert
      expect(mockProductionRepository.findAll).toHaveBeenCalledWith(10, 20);
      expect(result).toEqual(expectedProductions);
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockProductionRepository.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(productionService.getAllProductions()).rejects.toThrow(
        'Error getting productions: Database error'
      );
    });
  });

  describe('updateProduction', () => {
    const updateData = {
      name: 'Updated Production',
      qualification: 9.0,
    };

    it('should update production without image', async () => {
      // Arrange
      const expectedProduction = { id: 1, ...updateData };
      mockProductionRepository.update.mockResolvedValue(expectedProduction);

      // Act
      const result = await productionService.updateProduction(1, updateData);

      // Assert
      expect(mockProductionRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(expectedProduction);
    });

    it('should update production with new image', async () => {
      // Arrange
      const mockImageBuffer = Buffer.from('new-image-data');
      const optimizedBuffer = Buffer.from('optimized-image-data');
      const filename = 'production_1234567890.jpg';
      const imagePath = '/uploads/productions/production_1234567890.jpg';
      const currentProduction = { id: 1, image: '/old/path/image.jpg' };
      const expectedProduction = { id: 1, ...updateData, image: imagePath };

      mockProductionRepository.findById.mockResolvedValue(currentProduction);
      mockProductionRepository.update.mockResolvedValue(expectedProduction);
      (ImageHelper.optimizeImage as jest.Mock).mockResolvedValue(optimizedBuffer);
      (ImageHelper.generateUniqueFilename as jest.Mock).mockReturnValue(filename);
      (ImageHelper.saveOptimizedImage as jest.Mock).mockResolvedValue(imagePath);
      (ImageHelper.deleteImage as jest.Mock).mockResolvedValue();

      // Act
      const result = await productionService.updateProduction(1, updateData, mockImageBuffer);

      // Assert
      expect(ImageHelper.optimizeImage).toHaveBeenCalledWith(mockImageBuffer);
      expect(ImageHelper.deleteImage).toHaveBeenCalledWith('/old/path/image.jpg');
      expect(mockProductionRepository.update).toHaveBeenCalledWith(1, { ...updateData, image: imagePath });
      expect(result).toEqual(expectedProduction);
    });

    it('should handle errors during update', async () => {
      // Arrange
      const error = new Error('Database error');
      mockProductionRepository.update.mockRejectedValue(error);

      // Act & Assert
      await expect(productionService.updateProduction(1, updateData)).rejects.toThrow(
        'Error updating production: Database error'
      );
    });
  });

  describe('deleteProduction', () => {
    it('should delete production and its image', async () => {
      // Arrange
      const production = { id: 1, image: '/path/to/image.jpg' };
      mockProductionRepository.findById.mockResolvedValue(production);
      mockProductionRepository.delete.mockResolvedValue(true);
      (ImageHelper.deleteImage as jest.Mock).mockResolvedValue();

      // Act
      const result = await productionService.deleteProduction(1);

      // Assert
      expect(mockProductionRepository.findById).toHaveBeenCalledWith(1);
      expect(ImageHelper.deleteImage).toHaveBeenCalledWith('/path/to/image.jpg');
      expect(mockProductionRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should delete production without image', async () => {
      // Arrange
      const production = { id: 1, image: null };
      mockProductionRepository.findById.mockResolvedValue(production);
      mockProductionRepository.delete.mockResolvedValue(true);

      // Act
      const result = await productionService.deleteProduction(1);

      // Assert
      expect(ImageHelper.deleteImage).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle errors during deletion', async () => {
      // Arrange
      const error = new Error('Database error');
      mockProductionRepository.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(productionService.deleteProduction(1)).rejects.toThrow(
        'Error deleting production: Database error'
      );
    });
  });

  describe('searchProductions', () => {
    it('should search productions with filters', async () => {
      // Arrange
      const filters = { name: 'Test', year: 2023 };
      const expectedProductions = [{ id: 1, name: 'Test Production' }];
      mockProductionRepository.search.mockResolvedValue(expectedProductions);

      // Act
      const result = await productionService.searchProductions(filters);

      // Assert
      expect(mockProductionRepository.search).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expectedProductions);
    });

    it('should handle errors during search', async () => {
      // Arrange
      const error = new Error('Database error');
      mockProductionRepository.search.mockRejectedValue(error);

      // Act & Assert
      await expect(productionService.searchProductions({})).rejects.toThrow(
        'Error searching productions: Database error'
      );
    });
  });

  describe('updateProductionImage', () => {
    it('should update production image', async () => {
      // Arrange
      const mockImageBuffer = Buffer.from('new-image-data');
      const optimizedBuffer = Buffer.from('optimized-image-data');
      const filename = 'production_1234567890.jpg';
      const imagePath = '/uploads/productions/production_1234567890.jpg';
      const currentProduction = { id: 1, image: '/old/path/image.jpg' };
      const expectedProduction = { id: 1, image: imagePath };

      mockProductionRepository.findById.mockResolvedValue(currentProduction);
      mockProductionRepository.updateImage.mockResolvedValue(true);
      mockProductionRepository.findById
        .mockResolvedValueOnce(currentProduction)
        .mockResolvedValueOnce(expectedProduction);
      (ImageHelper.optimizeImage as jest.Mock).mockResolvedValue(optimizedBuffer);
      (ImageHelper.generateUniqueFilename as jest.Mock).mockReturnValue(filename);
      (ImageHelper.saveOptimizedImage as jest.Mock).mockResolvedValue(imagePath);
      (ImageHelper.deleteImage as jest.Mock).mockResolvedValue();

      // Act
      const result = await productionService.updateProductionImage(1, mockImageBuffer);

      // Assert
      expect(ImageHelper.optimizeImage).toHaveBeenCalledWith(mockImageBuffer);
      expect(ImageHelper.deleteImage).toHaveBeenCalledWith('/old/path/image.jpg');
      expect(mockProductionRepository.updateImage).toHaveBeenCalledWith(1, imagePath);
      expect(result).toEqual(expectedProduction);
    });

    it('should handle production not found', async () => {
      // Arrange
      mockProductionRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(productionService.updateProductionImage(999, Buffer.from('data'))).rejects.toThrow(
        'Error updating production image: Producción no encontrada'
      );
    });

    it('should handle errors during image update', async () => {
      // Arrange
      const error = new Error('Database error');
      mockProductionRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(productionService.updateProductionImage(1, Buffer.from('data'))).rejects.toThrow(
        'Error updating production image: Database error'
      );
    });
  });
});
