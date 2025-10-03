import { Request, Response } from 'express';
import { SeriesController } from '../../../../src/modules/series/infrastructure/controllers/series.controller';
// Command Handlers
import { CreateSeriesHandler } from '../../../../src/modules/series/application/handlers/commands/create-series.handler';
import { UpdateSeriesHandler } from '../../../../src/modules/series/application/handlers/commands/update-series.handler';
import { DeleteSeriesHandler } from '../../../../src/modules/series/application/handlers/commands/delete-series.handler';
import { AssignGenresHandler } from '../../../../src/modules/series/application/handlers/commands/assign-genres.handler';
import { RemoveGenresHandler } from '../../../../src/modules/series/application/handlers/commands/remove-genres.handler';
import { AddTitlesHandler } from '../../../../src/modules/series/application/handlers/commands/add-titles.handler';
import { RemoveTitlesHandler } from '../../../../src/modules/series/application/handlers/commands/remove-titles.handler';
import { CreateSeriesCompleteHandler } from '../../../../src/modules/series/application/handlers/commands/create-series-complete.handler';
import { UpdateSeriesImageHandler } from '../../../../src/modules/series/application/handlers/commands/update-series-image.handler';
// Query Handlers
import { GetSeriesByIdHandler } from '../../../../src/modules/series/application/handlers/queries/get-series-by-id.handler';
import { SearchSeriesHandler } from '../../../../src/modules/series/application/handlers/queries/search-series.handler';
import { GetAllSeriesHandler } from '../../../../src/modules/series/application/handlers/queries/get-all-series.handler';
import { GetGenresHandler } from '../../../../src/modules/series/application/handlers/queries/get-genres.handler';
import { GetDemographicsHandler } from '../../../../src/modules/series/application/handlers/queries/get-demographics.handler';
import { GetProductionYearsHandler } from '../../../../src/modules/series/application/handlers/queries/get-production-years.handler';
import { GetProductionsHandler } from '../../../../src/modules/series/application/handlers/queries/get-productions.handler';

// Mock all handlers
const mockCreateSeriesHandler = { execute: jest.fn() } as unknown as jest.Mocked<CreateSeriesHandler>;
const mockUpdateSeriesHandler = { execute: jest.fn() } as unknown as jest.Mocked<UpdateSeriesHandler>;
const mockDeleteSeriesHandler = { execute: jest.fn() } as unknown as jest.Mocked<DeleteSeriesHandler>;
const mockAssignGenresHandler = { execute: jest.fn() } as unknown as jest.Mocked<AssignGenresHandler>;
const mockRemoveGenresHandler = { execute: jest.fn() } as unknown as jest.Mocked<RemoveGenresHandler>;
const mockAddTitlesHandler = { execute: jest.fn() } as unknown as jest.Mocked<AddTitlesHandler>;
const mockRemoveTitlesHandler = { execute: jest.fn() } as unknown as jest.Mocked<RemoveTitlesHandler>;
const mockCreateSeriesCompleteHandler = {
  execute: jest.fn(),
} as unknown as jest.Mocked<CreateSeriesCompleteHandler>;
const mockUpdateSeriesImageHandler = { execute: jest.fn() } as unknown as jest.Mocked<UpdateSeriesImageHandler>;
const mockGetSeriesByIdHandler = { execute: jest.fn() } as unknown as jest.Mocked<GetSeriesByIdHandler>;
const mockSearchSeriesHandler = { execute: jest.fn() } as unknown as jest.Mocked<SearchSeriesHandler>;
const mockGetAllSeriesHandler = { execute: jest.fn() } as unknown as jest.Mocked<GetAllSeriesHandler>;
const mockGetGenresHandler = { execute: jest.fn() } as unknown as jest.Mocked<GetGenresHandler>;
const mockGetDemographicsHandler = { execute: jest.fn() } as unknown as jest.Mocked<GetDemographicsHandler>;
const mockGetProductionYearsHandler = { execute: jest.fn() } as unknown as jest.Mocked<GetProductionYearsHandler>;
const mockGetProductionsHandler = { execute: jest.fn() } as unknown as jest.Mocked<GetProductionsHandler>;

describe('SeriesController', () => {
  let seriesController: SeriesController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    seriesController = new SeriesController(
      // Command Handlers
      mockCreateSeriesHandler,
      mockUpdateSeriesHandler,
      mockDeleteSeriesHandler,
      mockAssignGenresHandler,
      mockRemoveGenresHandler,
      mockAddTitlesHandler,
      mockRemoveTitlesHandler,
      mockCreateSeriesCompleteHandler,
      mockUpdateSeriesImageHandler,
      // Query Handlers
      mockGetSeriesByIdHandler,
      mockSearchSeriesHandler,
      mockGetAllSeriesHandler,
      mockGetGenresHandler,
      mockGetDemographicsHandler,
      mockGetProductionYearsHandler,
      mockGetProductionsHandler
    );
    req = {
      body: {},
      params: {},
      query: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res as Response),
    };
    jest.clearAllMocks();
  });

  it('should get productions successfully', async () => {
    const requestBody = { limit: '10', offset: '0' };
    const expectedResult = [{ id: 1, name: 'Test Production' }];

    mockGetProductionsHandler.execute.mockResolvedValue(expectedResult);
    req.body = requestBody;

    await seriesController.getProductions(req as Request, res as Response);

    expect(mockGetProductionsHandler.execute).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedResult);
  });

  it('should handle error when getProductions fails', async () => {
    mockGetProductionsHandler.execute.mockRejectedValue(new Error('Database error'));

    await seriesController.getProductions(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: true, message: 'Internal server error' });
  });

  it('should get production years successfully', async () => {
    const expectedResult = [{ year: 2020 }, { year: 2021 }];

    mockGetProductionYearsHandler.execute.mockResolvedValue(expectedResult as any);

    await seriesController.getProductionYears(req as Request, res as Response);

    expect(mockGetProductionYearsHandler.execute).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedResult);
  });

  it('should handle error when getProductionYears fails', async () => {
    mockGetProductionYearsHandler.execute.mockRejectedValue(new Error('Database error'));

    await seriesController.getProductionYears(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: 'Database error',
    });
  });

  it('should create series successfully', async () => {
    const seriesData = {
      name: 'Test Series',
      chapter_number: 12,
      year: 2023,
      description: 'Test description',
      description_en: 'Test description EN',
      qualification: 8.5,
      demography_id: 1,
      visible: 'true',
    };

    const expectedResult = {
      id: 1,
      name: 'Test Series',
      chapter_number: 12,
      year: 2023,
      description: 'Test description',
      description_en: 'Test description EN',
      qualification: 8.5,
      demography_id: 1,
      visible: true, // Convert to boolean
    };

    mockCreateSeriesHandler.execute.mockResolvedValue(expectedResult as any);
    req.body = seriesData;

    await seriesController.createSeries(req as Request, res as Response);

    expect(mockCreateSeriesHandler.execute).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Series created successfully',
      data: expectedResult,
    });
  });

  it('should handle error when createSeries fails', async () => {
    const seriesData = {
      name: 'Test Series',
      chapter_number: 12,
      year: 2023,
      description: 'Test description',
      description_en: 'Test description EN',
      qualification: 8.5,
      demography_id: 1,
      visible: 'true',
    };

    mockCreateSeriesHandler.execute.mockRejectedValue(new Error('Database error'));
    req.body = seriesData;

    await seriesController.createSeries(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Database error',
    });
  });

  it('should get series by ID successfully', async () => {
    const expectedResult = {
      id: 1,
      name: 'Test Series',
      chapter_number: 12,
      year: 2023,
      description: 'Test description',
      description_en: 'Test description EN',
      qualification: 8.5,
      demography_id: 1,
      visible: true,
    };

    mockGetSeriesByIdHandler.execute.mockResolvedValue(expectedResult as any);
    req.params = { id: '1' };

    await seriesController.getSeriesById(req as Request, res as Response);

    expect(mockGetSeriesByIdHandler.execute).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expectedResult,
    });
  });

  it('should return 404 when series not found', async () => {
    mockGetSeriesByIdHandler.execute.mockResolvedValue(null);
    req.params = { id: '999' };

    await seriesController.getSeriesById(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Series not found',
    });
  });
});
