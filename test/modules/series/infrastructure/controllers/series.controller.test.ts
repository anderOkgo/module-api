import { Request, Response } from 'express';
import { SeriesController } from '../../../../../src/modules/series/infrastructure/controllers/series.controller';

// Mock all handlers
jest.mock('../../../../../src/modules/series/application/handlers/commands/create-series.handler');
jest.mock('../../../../../src/modules/series/application/handlers/commands/update-series.handler');
jest.mock('../../../../../src/modules/series/application/handlers/commands/delete-series.handler');
jest.mock('../../../../../src/modules/series/application/handlers/commands/assign-genres.handler');
jest.mock('../../../../../src/modules/series/application/handlers/commands/remove-genres.handler');
jest.mock('../../../../../src/modules/series/application/handlers/commands/add-titles.handler');
jest.mock('../../../../../src/modules/series/application/handlers/commands/remove-titles.handler');
jest.mock('../../../../../src/modules/series/application/handlers/commands/create-series-complete.handler');
jest.mock('../../../../../src/modules/series/application/handlers/commands/update-series-image.handler');
jest.mock('../../../../../src/modules/series/application/handlers/queries/get-series-by-id.handler');
jest.mock('../../../../../src/modules/series/application/handlers/queries/search-series.handler');
jest.mock('../../../../../src/modules/series/application/handlers/queries/get-all-series.handler');
jest.mock('../../../../../src/modules/series/application/handlers/queries/get-genres.handler');
jest.mock('../../../../../src/modules/series/application/handlers/queries/get-demographics.handler');
jest.mock('../../../../../src/modules/series/application/handlers/queries/get-production-years.handler');
jest.mock('../../../../../src/modules/series/application/handlers/queries/get-productions.handler');

// Mock validation function
jest.mock('../../../../../src/modules/series/infrastructure/validation/series.validation', () => ({
  validateProduction: jest.fn(),
}));

import {
  validateProduction,
  ValidationResult,
} from '../../../../../src/modules/series/infrastructure/validation/series.validation';

const mockValidateProduction = validateProduction as jest.MockedFunction<typeof validateProduction>;

describe('SeriesController - Fixed Tests', () => {
  let controller: SeriesController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockHandlers: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock handlers
    mockHandlers = {
      createSeriesHandler: { execute: jest.fn() },
      updateSeriesHandler: { execute: jest.fn() },
      deleteSeriesHandler: { execute: jest.fn() },
      assignGenresHandler: { execute: jest.fn() },
      removeGenresHandler: { execute: jest.fn() },
      addTitlesHandler: { execute: jest.fn() },
      removeTitlesHandler: { execute: jest.fn() },
      createSeriesCompleteHandler: { execute: jest.fn() },
      updateSeriesImageHandler: { execute: jest.fn() },
      getSeriesByIdHandler: { execute: jest.fn() },
      searchSeriesHandler: { execute: jest.fn() },
      getAllSeriesHandler: { execute: jest.fn() },
      getGenresHandler: { execute: jest.fn() },
      getDemographicsHandler: { execute: jest.fn() },
      getProductionYearsHandler: { execute: jest.fn() },
      getProductionsHandler: { execute: jest.fn() },
    };

    // Create controller instance
    controller = new SeriesController(
      mockHandlers.createSeriesHandler,
      mockHandlers.updateSeriesHandler,
      mockHandlers.deleteSeriesHandler,
      mockHandlers.assignGenresHandler,
      mockHandlers.removeGenresHandler,
      mockHandlers.addTitlesHandler,
      mockHandlers.removeTitlesHandler,
      mockHandlers.createSeriesCompleteHandler,
      mockHandlers.updateSeriesImageHandler,
      mockHandlers.getSeriesByIdHandler,
      mockHandlers.searchSeriesHandler,
      mockHandlers.getAllSeriesHandler,
      mockHandlers.getGenresHandler,
      mockHandlers.getDemographicsHandler,
      mockHandlers.getProductionYearsHandler,
      mockHandlers.getProductionsHandler
    );

    // Mock request and response objects
    mockRequest = {
      body: {},
      params: {},
      query: {},
      file: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('searchSeries', () => {
    it('should search series successfully', async () => {
      // Arrange
      const mockResult = [{ id: 1, name: 'Test Series' }];
      mockRequest.body = {
        name: 'Test Series',
        year: 2023,
        genres: [1, 2],
      };

      mockHandlers.searchSeriesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.searchSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.searchSeriesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            name: 'Test Series',
            year: 2023,
            genres: [1, 2],
          }),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        count: mockResult.length,
      });
    });

    it('should handle searchSeries errors', async () => {
      // Arrange
      const error = new Error('Search failed');
      mockRequest.body = { name: 'Test Series' };

      mockHandlers.searchSeriesHandler.execute.mockRejectedValue(error);

      // Act
      await controller.searchSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search failed',
      });
    });
  });

  describe('getAllSeries', () => {
    it('should get all series successfully', async () => {
      // Arrange
      const mockResult = {
        series: [{ id: 1, name: 'Test Series' }],
        pagination: { limit: 50, offset: 0, total: 1 },
      };
      mockRequest.query = { limit: '20', offset: '10' };

      mockHandlers.getAllSeriesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.getAllSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.getAllSeriesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
          offset: 10,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.series,
        pagination: mockResult.pagination,
      });
    });

    it('should use default pagination values', async () => {
      // Arrange
      const mockResult = {
        series: [{ id: 1, name: 'Test Series' }],
        pagination: { limit: 50, offset: 0, total: 1 },
      };
      mockRequest.query = {};

      mockHandlers.getAllSeriesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.getAllSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.getAllSeriesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          offset: 0,
        })
      );
    });

    it('should handle getAllSeries errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRequest.query = { limit: '20' };

      mockHandlers.getAllSeriesHandler.execute.mockRejectedValue(error);

      // Act
      await controller.getAllSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
      });
    });
  });

  describe('getGenres', () => {
    it('should get genres successfully', async () => {
      // Arrange
      const mockResult = {
        genres: [{ id: 1, name: 'Action' }],
        total: 1,
      };

      mockHandlers.getGenresHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.getGenres(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.getGenresHandler.execute).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle getGenres errors', async () => {
      // Arrange
      const error = new Error('Database error');

      mockHandlers.getGenresHandler.execute.mockRejectedValue(error);

      // Act
      await controller.getGenres(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Database error',
      });
    });
  });

  describe('getDemographics', () => {
    it('should get demographics successfully', async () => {
      // Arrange
      const mockResult = {
        demographics: [{ id: 1, name: 'Shounen' }],
        total: 1,
      };

      mockHandlers.getDemographicsHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.getDemographics(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.getDemographicsHandler.execute).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle getDemographics errors', async () => {
      // Arrange
      const error = new Error('Database error');

      mockHandlers.getDemographicsHandler.execute.mockRejectedValue(error);

      // Act
      await controller.getDemographics(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Database error',
      });
    });
  });

  describe('getProductionYears', () => {
    it('should get production years successfully', async () => {
      // Arrange
      const mockResult = {
        years: [{ id: 1, year: 2023 }],
        total: 1,
      };

      mockHandlers.getProductionYearsHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.getProductionYears(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.getProductionYearsHandler.execute).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle getProductionYears errors', async () => {
      // Arrange
      const error = new Error('Database error');

      mockHandlers.getProductionYearsHandler.execute.mockRejectedValue(error);

      // Act
      await controller.getProductionYears(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: true,
        message: 'Database error',
      });
    });
  });

  describe('getProductions', () => {
    it('should get productions successfully', async () => {
      // Arrange
      const mockResult = [{ id: 1, name: 'Production 1' }];
      mockRequest.body = {
        type: 'anime',
        demographic: 'shounen',
        genre: 1,
        state: 'completed',
        production: 'Studio Ghibli',
        year: 2023,
        limit: 20,
        offset: 0,
      };

      const validationResult = {
        valid: true,
        result: { limit: 10000 },
      };

      mockValidateProduction.mockReturnValue(validationResult);
      mockHandlers.getProductionsHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.getProductions(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidateProduction).toHaveBeenCalledWith(mockRequest.body);
      expect(mockHandlers.getProductionsHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { limit: 10000 },
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle validation errors in getProductions', async () => {
      // Arrange
      mockRequest.body = { invalid: 'data' };

      const validationResult = {
        valid: false,
        errors: ['Validation failed'],
      };

      mockValidateProduction.mockReturnValue(validationResult as unknown as ValidationResult);

      // Act
      await controller.getProductions(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidateProduction).toHaveBeenCalledWith(mockRequest.body);
      expect(mockHandlers.getProductionsHandler.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(['Validation failed']);
    });

    it('should handle getProductions errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRequest.body = { type: 'anime' };

      const validationResult = {
        valid: true,
        result: { limit: 10000 },
      };

      mockValidateProduction.mockReturnValue(validationResult);
      mockHandlers.getProductionsHandler.execute.mockRejectedValue(error);

      // Act
      await controller.getProductions(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: true,
        message: 'Internal server error',
      });
    });
  });

  describe('createSeries', () => {
    it('should create a series successfully', async () => {
      // Arrange
      const mockResult = { id: 1, name: 'Test Series' };
      mockRequest.body = {
        name: 'Test Series',
        chapter_number: '1',
        year: '2023',
        description: 'Test description',
        description_en: 'Test description in English',
        qualification: '8.5',
        demography_id: '1',
        visible: 'true',
      };
      mockRequest.file = {
        buffer: Buffer.from('test-image-data'),
      } as any;

      mockHandlers.createSeriesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.createSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.createSeriesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Series',
          chapter_number: 1,
          year: 2023,
          description: 'Test description',
          description_en: 'Test description in English',
          qualification: 8.5,
          demography_id: 1,
          visible: true,
          imageBuffer: Buffer.from('test-image-data'),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Series created successfully',
        data: mockResult,
      });
    });

    it('should handle createSeries errors', async () => {
      // Arrange
      const error = new Error('Validation failed');
      mockRequest.body = {
        name: 'Test Series',
        chapter_number: '1',
        year: '2023',
        description: 'Test description',
        description_en: 'Test description in English',
        qualification: '8.5',
        demography_id: '1',
        visible: 'true',
      };

      mockHandlers.createSeriesHandler.execute.mockRejectedValue(error);

      // Act
      await controller.createSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
      });
    });
  });

  describe('updateSeries', () => {
    it('should update a series successfully', async () => {
      // Arrange
      const mockResult = { id: 1, name: 'Updated Series' };
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: 'Updated Series',
        chapter_number: '2',
        year: '2024',
        description: 'Updated description',
        description_en: 'Updated description in English',
        qualification: '9.0',
        demography_id: '2',
        visible: 'false',
      };

      mockHandlers.updateSeriesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.updateSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.updateSeriesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: 'Updated Series',
          chapter_number: 2,
          year: 2024,
          description: 'Updated description',
          description_en: 'Updated description in English',
          qualification: 9.0,
          demography_id: 2,
          visible: false,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Series updated successfully',
        data: mockResult,
      });
    });
  });

  describe('deleteSeries', () => {
    it('should delete a series successfully', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Series deleted successfully' };
      mockRequest.params = { id: '1' };

      mockHandlers.deleteSeriesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.deleteSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.deleteSeriesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Series deleted successfully',
      });
    });

    it('should handle deleteSeries when series not found', async () => {
      // Arrange
      const mockResult = { success: false, message: 'Series not found' };
      mockRequest.params = { id: '999' };

      mockHandlers.deleteSeriesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.deleteSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Series not found',
      });
    });
  });

  describe('getSeriesById', () => {
    it('should get a series by ID successfully', async () => {
      // Arrange
      const mockResult = { id: 1, name: 'Test Series' };
      mockRequest.params = { id: '1' };

      mockHandlers.getSeriesByIdHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.getSeriesById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.getSeriesByIdHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should handle getSeriesById when series not found', async () => {
      // Arrange
      mockRequest.params = { id: '999' };

      mockHandlers.getSeriesByIdHandler.execute.mockResolvedValue(null);

      // Act
      await controller.getSeriesById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Series not found',
      });
    });
  });

  describe('createSeriesComplete', () => {
    it('should create complete series successfully', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Series created successfully', id: 123 };
      mockRequest.body = {
        name: 'Complete Test Series',
        chapter_number: 1,
        year: 2023,
        description: 'Complete test description',
        description_en: 'Complete test description in English',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        genres: [1, 2, 3],
        titles: ['Title 1', 'Title 2'],
      };

      mockHandlers.createSeriesCompleteHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.createSeriesComplete(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.createSeriesCompleteHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          seriesData: mockRequest.body,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Series created successfully',
        id: 123,
      });
    });

    it('should handle createSeriesComplete errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockRequest.body = { name: 'Test Series' };

      mockHandlers.createSeriesCompleteHandler.execute.mockRejectedValue(error);

      // Act
      await controller.createSeriesComplete(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        message: 'Database connection failed',
      });
    });

    it('should handle createSeriesComplete with unknown error', async () => {
      // Arrange
      mockRequest.body = { name: 'Test Series' };

      mockHandlers.createSeriesCompleteHandler.execute.mockRejectedValue('Unknown error');

      // Act
      await controller.createSeriesComplete(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        message: 'Unknown error',
      });
    });
  });

  describe('updateSeriesImage', () => {
    it('should update series image successfully', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Image updated successfully' };
      mockRequest.params = { id: '123' };
      mockRequest.file = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test-image-data'),
        destination: '',
        filename: '',
        path: '',
      } as any;

      mockHandlers.updateSeriesImageHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.updateSeriesImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.updateSeriesImageHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          seriesId: 123,
          imageFile: mockRequest.file,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Image updated successfully',
      });
    });

    it('should handle invalid ID in updateSeriesImage', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid' };

      // Act
      await controller.updateSeriesImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid ID',
      });
    });

    it('should handle missing image file in updateSeriesImage', async () => {
      // Arrange
      mockRequest.params = { id: '123' };
      mockRequest.file = undefined;

      // Act
      await controller.updateSeriesImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'No image sent',
      });
    });

    it('should handle updateSeriesImage errors', async () => {
      // Arrange
      const error = new Error('Image processing failed');
      mockRequest.params = { id: '123' };
      mockRequest.file = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test-image-data'),
        destination: '',
        filename: '',
        path: '',
      } as any;

      mockHandlers.updateSeriesImageHandler.execute.mockRejectedValue(error);

      // Act
      await controller.updateSeriesImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        message: 'Image processing failed',
      });
    });
  });

  describe('assignGenres', () => {
    it('should assign genres successfully with genreIds', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Genres assigned successfully' };
      mockRequest.params = { id: '123' };
      mockRequest.body = { genreIds: [1, 2, 3] };

      mockHandlers.assignGenresHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.assignGenres(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.assignGenresHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          seriesId: 123,
          genreIds: [1, 2, 3],
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should assign genres successfully with genre_ids', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Genres assigned successfully' };
      mockRequest.params = { id: '123' };
      mockRequest.body = { genre_ids: [4, 5] };

      mockHandlers.assignGenresHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.assignGenres(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.assignGenresHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          seriesId: 123,
          genreIds: [4, 5],
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should assign genres successfully with genres', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Genres assigned successfully' };
      mockRequest.params = { id: '123' };
      mockRequest.body = { genres: [6, 7, 8] };

      mockHandlers.assignGenresHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.assignGenres(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.assignGenresHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          seriesId: 123,
          genreIds: [6, 7, 8],
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle empty genres array', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Genres assigned successfully' };
      mockRequest.params = { id: '123' };
      mockRequest.body = {};

      mockHandlers.assignGenresHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.assignGenres(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.assignGenresHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          seriesId: 123,
          genreIds: [],
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle assignGenres errors', async () => {
      // Arrange
      const error = new Error('Genre assignment failed');
      mockRequest.params = { id: '123' };
      mockRequest.body = { genreIds: [1, 2] };

      mockHandlers.assignGenresHandler.execute.mockRejectedValue(error);

      // Act
      await controller.assignGenres(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Genre assignment failed',
      });
    });
  });

  describe('removeGenres', () => {
    it('should remove genres successfully with genreIds', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Genres removed successfully' };
      mockRequest.params = { id: '123' };
      mockRequest.body = { genreIds: [1, 2] };

      mockHandlers.removeGenresHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.removeGenres(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.removeGenresHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          seriesId: 123,
          genreIds: [1, 2],
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle removeGenres errors', async () => {
      // Arrange
      const error = new Error('Genre removal failed');
      mockRequest.params = { id: '123' };
      mockRequest.body = { genreIds: [1] };

      mockHandlers.removeGenresHandler.execute.mockRejectedValue(error);

      // Act
      await controller.removeGenres(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Genre removal failed',
      });
    });
  });

  describe('addTitles', () => {
    it('should add titles successfully', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Titles added successfully' };
      mockRequest.params = { id: '123' };
      mockRequest.body = { titles: ['Title 1', 'Title 2', 'Title 3'] };

      mockHandlers.addTitlesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.addTitles(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.addTitlesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          seriesId: 123,
          titles: ['Title 1', 'Title 2', 'Title 3'],
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle empty titles array', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Titles added successfully' };
      mockRequest.params = { id: '123' };
      mockRequest.body = {};

      mockHandlers.addTitlesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.addTitles(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.addTitlesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          seriesId: 123,
          titles: [],
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle addTitles errors', async () => {
      // Arrange
      const error = new Error('Title addition failed');
      mockRequest.params = { id: '123' };
      mockRequest.body = { titles: ['New Title'] };

      mockHandlers.addTitlesHandler.execute.mockRejectedValue(error);

      // Act
      await controller.addTitles(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Title addition failed',
      });
    });
  });

  describe('removeTitles', () => {
    it('should remove titles successfully with titleIds', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Titles removed successfully' };
      mockRequest.params = { id: '123' };
      mockRequest.body = { titleIds: [1, 2, 3] };

      mockHandlers.removeTitlesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.removeTitles(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.removeTitlesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          seriesId: 123,
          titleIds: [1, 2, 3],
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should remove titles successfully with title_ids', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Titles removed successfully' };
      mockRequest.params = { id: '123' };
      mockRequest.body = { title_ids: [4, 5] };

      mockHandlers.removeTitlesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.removeTitles(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.removeTitlesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          seriesId: 123,
          titleIds: [4, 5],
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should remove titles successfully with titles', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Titles removed successfully' };
      mockRequest.params = { id: '123' };
      mockRequest.body = { titles: [6, 7] };

      mockHandlers.removeTitlesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.removeTitles(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.removeTitlesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          seriesId: 123,
          titleIds: [6, 7],
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle empty titles array', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Titles removed successfully' };
      mockRequest.params = { id: '123' };
      mockRequest.body = {};

      mockHandlers.removeTitlesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.removeTitles(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.removeTitlesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          seriesId: 123,
          titleIds: [],
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle removeTitles errors', async () => {
      // Arrange
      const error = new Error('Title removal failed');
      mockRequest.params = { id: '123' };
      mockRequest.body = { titleIds: [1] };

      mockHandlers.removeTitlesHandler.execute.mockRejectedValue(error);

      // Act
      await controller.removeTitles(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Title removal failed',
      });
    });
  });

  describe('updateSeries - Edge Cases', () => {
    it('should handle updateSeries with empty string values', async () => {
      // Arrange
      const mockResult = { id: 1, name: 'Updated Series' };
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: '',
        chapter_number: '',
        year: '',
        description: '',
        description_en: '',
        qualification: '',
        demography_id: '',
        visible: 'false',
      };

      mockHandlers.updateSeriesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.updateSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.updateSeriesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: undefined,
          chapter_number: undefined,
          year: undefined,
          description: undefined,
          description_en: undefined,
          qualification: undefined,
          demography_id: undefined,
          visible: false,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Series updated successfully',
        data: mockResult,
      });
    });

    it('should handle updateSeries with whitespace-only values', async () => {
      // Arrange
      const mockResult = { id: 1, name: 'Updated Series' };
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: '   ',
        description: '   ',
        description_en: '   ',
      };

      mockHandlers.updateSeriesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.updateSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.updateSeriesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: undefined,
          description: undefined,
          description_en: undefined,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Series updated successfully',
        data: mockResult,
      });
    });

    it('should handle updateSeries with undefined visible', async () => {
      // Arrange
      const mockResult = { id: 1, name: 'Updated Series' };
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: 'Updated Series',
      };

      mockHandlers.updateSeriesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.updateSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.updateSeriesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: 'Updated Series',
          visible: undefined,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Series updated successfully',
        data: mockResult,
      });
    });

    it('should handle updateSeries errors', async () => {
      // Arrange
      const error = new Error('Update failed');
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Series' };

      mockHandlers.updateSeriesHandler.execute.mockRejectedValue(error);

      // Act
      await controller.updateSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Update failed',
      });
    });

    it('should handle updateSeries with unknown error', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Series' };

      mockHandlers.updateSeriesHandler.execute.mockRejectedValue('Unknown error');

      // Act
      await controller.updateSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error updating series',
      });
    });
  });

  describe('createSeries - Edge Cases', () => {
    it('should handle createSeries without image file', async () => {
      // Arrange
      const mockResult = { id: 1, name: 'Test Series' };
      mockRequest.body = {
        name: 'Test Series',
        chapter_number: '1',
        year: '2023',
        description: 'Test description',
        description_en: 'Test description in English',
        qualification: '8.5',
        demography_id: '1',
        visible: 'true',
      };
      mockRequest.file = undefined;

      mockHandlers.createSeriesHandler.execute.mockResolvedValue(mockResult);

      // Act
      await controller.createSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockHandlers.createSeriesHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Series',
          chapter_number: 1,
          year: 2023,
          description: 'Test description',
          description_en: 'Test description in English',
          qualification: 8.5,
          demography_id: 1,
          visible: true,
          imageBuffer: undefined,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Series created successfully',
        data: mockResult,
      });
    });

    it('should handle createSeries with unknown error', async () => {
      // Arrange
      mockRequest.body = {
        name: 'Test Series',
        chapter_number: '1',
        year: '2023',
        description: 'Test description',
        description_en: 'Test description in English',
        qualification: '8.5',
        demography_id: '1',
        visible: 'true',
      };

      mockHandlers.createSeriesHandler.execute.mockRejectedValue('Unknown error');

      // Act
      await controller.createSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating series',
      });
    });
  });

  describe('deleteSeries - Error Cases', () => {
    it('should handle deleteSeries errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRequest.params = { id: '1' };

      mockHandlers.deleteSeriesHandler.execute.mockRejectedValue(error);

      // Act
      await controller.deleteSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
      });
    });

    it('should handle deleteSeries with unknown error', async () => {
      // Arrange
      mockRequest.params = { id: '1' };

      mockHandlers.deleteSeriesHandler.execute.mockRejectedValue('Unknown error');

      // Act
      await controller.deleteSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error deleting series',
      });
    });
  });

  describe('getSeriesById - Error Cases', () => {
    it('should handle getSeriesById errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRequest.params = { id: '1' };

      mockHandlers.getSeriesByIdHandler.execute.mockRejectedValue(error);

      // Act
      await controller.getSeriesById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
      });
    });

    it('should handle getSeriesById with unknown error', async () => {
      // Arrange
      mockRequest.params = { id: '1' };

      mockHandlers.getSeriesByIdHandler.execute.mockRejectedValue('Unknown error');

      // Act
      await controller.getSeriesById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching series',
      });
    });
  });

  describe('searchSeries - Error Cases', () => {
    it('should handle searchSeries with unknown error', async () => {
      // Arrange
      mockRequest.body = { name: 'Test Series' };

      mockHandlers.searchSeriesHandler.execute.mockRejectedValue('Unknown error');

      // Act
      await controller.searchSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error searching series',
      });
    });
  });

  describe('getAllSeries - Error Cases', () => {
    it('should handle getAllSeries with unknown error', async () => {
      // Arrange
      mockRequest.query = { limit: '20' };

      mockHandlers.getAllSeriesHandler.execute.mockRejectedValue('Unknown error');

      // Act
      await controller.getAllSeries(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching series list',
      });
    });
  });

  describe('getGenres - Error Cases', () => {
    it('should handle getGenres with unknown error', async () => {
      // Arrange
      mockHandlers.getGenresHandler.execute.mockRejectedValue('Unknown error');

      // Act
      await controller.getGenres(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Unknown error',
      });
    });
  });

  describe('getDemographics - Error Cases', () => {
    it('should handle getDemographics with unknown error', async () => {
      // Arrange
      mockHandlers.getDemographicsHandler.execute.mockRejectedValue('Unknown error');

      // Act
      await controller.getDemographics(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Unknown error',
      });
    });
  });

  describe('getProductionYears - Error Cases', () => {
    it('should handle getProductionYears with unknown error', async () => {
      // Arrange
      mockHandlers.getProductionYearsHandler.execute.mockRejectedValue('Unknown error');

      // Act
      await controller.getProductionYears(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: true,
        message: 'Internal server error',
      });
    });
  });

  describe('getProductions - Error Cases', () => {
    it('should handle getProductions with unknown error', async () => {
      // Arrange
      mockRequest.body = { type: 'anime' };

      const validationResult = {
        valid: true,
        result: { limit: 10000 },
      };

      mockValidateProduction.mockReturnValue(validationResult);
      mockHandlers.getProductionsHandler.execute.mockRejectedValue('Unknown error');

      // Act
      await controller.getProductions(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: true,
        message: 'Internal server error',
      });
    });
  });

  describe('uploadImageMiddleware', () => {
    it('should have uploadImageMiddleware property', () => {
      // Assert
      expect(controller.uploadImageMiddleware).toBeDefined();
      expect(typeof controller.uploadImageMiddleware).toBe('function');
    });
  });
});
