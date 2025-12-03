import { Router } from 'express';
import validateToken from '../../../../infrastructure/services/validate-token';
import validateAdmin from '../../../../infrastructure/services/validate-admin';
import { SeriesController } from '../controllers/series.controller';
import { ImageService } from '../../application/services/image.service';
import { SeriesImageProcessorService } from '../services/image-processor.service';
// CQRS imports
import { SeriesWriteMysqlRepository } from '../persistence/series-write.mysql';
import { SeriesReadMysqlRepository } from '../persistence/series-read.mysql';
import { CreateSeriesHandler } from '../../application/handlers/commands/create-series.handler';
import { UpdateSeriesHandler } from '../../application/handlers/commands/update-series.handler';
import { DeleteSeriesHandler } from '../../application/handlers/commands/delete-series.handler';
import { AssignGenresHandler } from '../../application/handlers/commands/assign-genres.handler';
import { RemoveGenresHandler } from '../../application/handlers/commands/remove-genres.handler';
import { AddTitlesHandler } from '../../application/handlers/commands/add-titles.handler';
import { RemoveTitlesHandler } from '../../application/handlers/commands/remove-titles.handler';
import { CreateSeriesCompleteHandler } from '../../application/handlers/commands/create-series-complete.handler';
import { UpdateSeriesImageHandler } from '../../application/handlers/commands/update-series-image.handler';
import { GetSeriesByIdHandler } from '../../application/handlers/queries/get-series-by-id.handler';
import { SearchSeriesHandler } from '../../application/handlers/queries/search-series.handler';
import { GetAllSeriesHandler } from '../../application/handlers/queries/get-all-series.handler';
import { GetGenresHandler } from '../../application/handlers/queries/get-genres.handler';
import { GetDemographicsHandler } from '../../application/handlers/queries/get-demographics.handler';
import { GetProductionYearsHandler } from '../../application/handlers/queries/get-production-years.handler';
import { GetProductionsHandler } from '../../application/handlers/queries/get-productions.handler';

/**
 * Composition Root for the Series module
 * Implements CQRS Pattern - Complete separation between Commands and Queries
 * Builds and wires dependencies using Clean Architecture + Hexagonal
 */
export function buildSeriesModule() {
  // 1. Repositories (separated by responsibility - CQRS)
  const writeRepository = new SeriesWriteMysqlRepository();
  const readRepository = new SeriesReadMysqlRepository();

  // 2. Infrastructure services
  const imageProcessorService = new SeriesImageProcessorService();

  // 3. Application services
  const imageService = new ImageService(imageProcessorService);

  // 4. Command Handlers (write) - CQRS
  const createSeriesHandler = new CreateSeriesHandler(writeRepository, readRepository, imageService);
  const updateSeriesHandler = new UpdateSeriesHandler(writeRepository, readRepository);
  const deleteSeriesHandler = new DeleteSeriesHandler(writeRepository, readRepository, imageService);
  const assignGenresHandler = new AssignGenresHandler(writeRepository, readRepository);
  const removeGenresHandler = new RemoveGenresHandler(writeRepository, readRepository);
  const addTitlesHandler = new AddTitlesHandler(writeRepository, readRepository);
  const removeTitlesHandler = new RemoveTitlesHandler(writeRepository, readRepository);
  const createSeriesCompleteHandler = new CreateSeriesCompleteHandler(writeRepository, readRepository);
  const updateSeriesImageHandler = new UpdateSeriesImageHandler(writeRepository, readRepository, imageService);

  // 5. Query Handlers (read) - CQRS
  const getSeriesByIdHandler = new GetSeriesByIdHandler(readRepository);
  const searchSeriesHandler = new SearchSeriesHandler(readRepository);
  const getAllSeriesHandler = new GetAllSeriesHandler(readRepository);
  const getGenresHandler = new GetGenresHandler(readRepository);
  const getDemographicsHandler = new GetDemographicsHandler(readRepository);
  const getProductionYearsHandler = new GetProductionYearsHandler(readRepository);
  const getProductionsHandler = new GetProductionsHandler(readRepository);

  // 6. CQRS Controller (100% CQRS)
  const seriesController = new SeriesController(
    // Commands (CQRS)
    createSeriesHandler,
    updateSeriesHandler,
    deleteSeriesHandler,
    assignGenresHandler,
    removeGenresHandler,
    addTitlesHandler,
    removeTitlesHandler,
    createSeriesCompleteHandler,
    updateSeriesImageHandler,
    // Queries (CQRS)
    getSeriesByIdHandler,
    searchSeriesHandler,
    getAllSeriesHandler,
    getGenresHandler,
    getDemographicsHandler,
    getProductionYearsHandler,
    getProductionsHandler
  );

  // 7. Configure routes (IMPORTANT ORDER: specific before parameters)
  const router = Router();

  // Specific routes (no parameters) - MUST go FIRST
  router.post('/', seriesController.getProductions); // Boot endpoint
  router.get('/years', seriesController.getProductionYears);
  router.get('/list', validateToken, seriesController.getAllSeries);
  router.post('/search', seriesController.searchSeries);
  router.post('/create', validateAdmin, seriesController.uploadImageMiddleware, seriesController.createSeries);
  router.post('/create-complete', validateAdmin, seriesController.createSeriesComplete);
  router.get('/genres', seriesController.getGenres);
  router.get('/demographics', seriesController.getDemographics);

  // Routes with parameters - MUST go AFTER
  router.get('/:id', seriesController.getSeriesById);
  router.put('/:id', validateAdmin, seriesController.uploadImageMiddleware, seriesController.updateSeries);
  router.delete('/:id', validateAdmin, seriesController.deleteSeries);
  router.put(
    '/:id/image',
    validateAdmin,
    seriesController.uploadImageMiddleware,
    seriesController.updateSeriesImage
  );

  // Routes for relationships (only admin can modify)
  router.post('/:id/genres', validateAdmin, seriesController.assignGenres);
  router.delete('/:id/genres', validateAdmin, seriesController.removeGenres);
  router.post('/:id/titles', validateAdmin, seriesController.addTitles);
  router.delete('/:id/titles', validateAdmin, seriesController.removeTitles);

  return {
    router,
    seriesController,
    writeRepository,
    readRepository,
    // Command Handlers
    createSeriesHandler,
    updateSeriesHandler,
    deleteSeriesHandler,
    assignGenresHandler,
    removeGenresHandler,
    addTitlesHandler,
    removeTitlesHandler,
    createSeriesCompleteHandler,
    updateSeriesImageHandler,
    // Query Handlers
    getSeriesByIdHandler,
    searchSeriesHandler,
    getAllSeriesHandler,
    getGenresHandler,
    getDemographicsHandler,
    getProductionYearsHandler,
    getProductionsHandler,
  };
}
