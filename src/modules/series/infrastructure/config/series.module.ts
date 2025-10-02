import { Router } from 'express';
import validateToken from '../../../../infrastructure/services/validate-token';
import { SeriesController } from '../controllers/series.controller';
import { SeriesCQRSController } from '../controllers/series-cqrs.controller';
import { GetProductionsUseCase } from '../../application/use-cases/get-productions.use-case';
import { GetProductionYearsUseCase } from '../../application/use-cases/get-production-years.use-case';
import { CreateSeriesUseCase } from '../../application/use-cases/create-series.use-case';
import { GetSeriesByIdUseCase } from '../../application/use-cases/get-series-by-id.use-case';
import { UpdateSeriesImageUseCase } from '../../application/use-cases/update-series-image.use-case';
import { UpdateSeriesUseCase } from '../../application/use-cases/update-series.use-case';
import { GetAllSeriesUseCase } from '../../application/use-cases/get-all-series.use-case';
import { DeleteSeriesUseCase } from '../../application/use-cases/delete-series.use-case';
import { SearchSeriesUseCase } from '../../application/use-cases/search-series.use-case';
import { CreateSeriesCompleteUseCase } from '../../application/use-cases/create-series-complete.use-case';
import { AssignGenresUseCase } from '../../application/use-cases/assign-genres.use-case';
import { RemoveGenresUseCase } from '../../application/use-cases/remove-genres.use-case';
import { AddTitlesUseCase } from '../../application/use-cases/add-titles.use-case';
import { RemoveTitlesUseCase } from '../../application/use-cases/remove-titles.use-case';
import { GetGenresUseCase } from '../../application/use-cases/get-genres.use-case';
import { GetDemographicsUseCase } from '../../application/use-cases/get-demographics.use-case';
import { ProductionMysqlRepository } from '../persistence/series.mysql';
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
import { GetSeriesByIdHandler } from '../../application/handlers/queries/get-series-by-id.handler';
import { SearchSeriesHandler } from '../../application/handlers/queries/search-series.handler';
import { GetAllSeriesHandler } from '../../application/handlers/queries/get-all-series.handler';
import { GetGenresHandler } from '../../application/handlers/queries/get-genres.handler';
import { GetDemographicsHandler } from '../../application/handlers/queries/get-demographics.handler';
import { GetProductionYearsHandler } from '../../application/handlers/queries/get-production-years.handler';
import { GetProductionsHandler } from '../../application/handlers/queries/get-productions.handler';
import { CreateSeriesCompleteHandler } from '../../application/handlers/commands/create-series-complete.handler';
import { UpdateSeriesImageHandler } from '../../application/handlers/commands/update-series-image.handler';

/**
 * Composition Root para el módulo Series
 * Construye y cablea las dependencias usando Clean Architecture
 * Sigue el patrón hexagonal con inyección de dependencias
 */
export function buildSeriesModule() {
  // 1. Crear repositorio (Infrastructure Layer)
  const seriesRepository = new ProductionMysqlRepository();

  // 2. Crear servicios de infraestructura
  const imageProcessorService = new SeriesImageProcessorService();

  // 3. Crear servicios de dominio
  const imageService = new ImageService(imageProcessorService);

  // 4. Crear Use Cases (Application Layer) - inyectando dependencias
  const getProductionsUseCase = new GetProductionsUseCase(seriesRepository);
  const getProductionYearsUseCase = new GetProductionYearsUseCase(seriesRepository);
  const createSeriesUseCase = new CreateSeriesUseCase(seriesRepository, imageService);
  const getSeriesByIdUseCase = new GetSeriesByIdUseCase(seriesRepository);
  const updateSeriesImageUseCase = new UpdateSeriesImageUseCase(seriesRepository, imageService);
  const updateSeriesUseCase = new UpdateSeriesUseCase(seriesRepository);
  const getAllSeriesUseCase = new GetAllSeriesUseCase(seriesRepository);
  const deleteSeriesUseCase = new DeleteSeriesUseCase(seriesRepository, imageService);
  const searchSeriesUseCase = new SearchSeriesUseCase(seriesRepository);
  const createSeriesCompleteUseCase = new CreateSeriesCompleteUseCase(seriesRepository);
  const assignGenresUseCase = new AssignGenresUseCase(seriesRepository);
  const removeGenresUseCase = new RemoveGenresUseCase(seriesRepository);
  const addTitlesUseCase = new AddTitlesUseCase(seriesRepository);
  const removeTitlesUseCase = new RemoveTitlesUseCase(seriesRepository);
  const getGenresUseCase = new GetGenresUseCase(seriesRepository);
  const getDemographicsUseCase = new GetDemographicsUseCase(seriesRepository);

  // 5. Crear Controlador (Infrastructure Layer) - inyectando Use Cases
  const seriesController = new SeriesController(
    getProductionsUseCase,
    getProductionYearsUseCase,
    createSeriesUseCase,
    getSeriesByIdUseCase,
    updateSeriesImageUseCase,
    updateSeriesUseCase,
    getAllSeriesUseCase,
    deleteSeriesUseCase,
    searchSeriesUseCase,
    createSeriesCompleteUseCase,
    assignGenresUseCase,
    removeGenresUseCase,
    addTitlesUseCase,
    removeTitlesUseCase,
    getGenresUseCase,
    getDemographicsUseCase
  );

  // 6. Configurar rutas (ORDEN IMPORTANTE: específicas antes que parámetros)
  const router = Router();

  // Rutas específicas (sin parámetros) - DEBEN ir ANTES
  router.post('/', seriesController.getProductions);
  router.get('/years', seriesController.getProductionYears);
  router.get('/list', validateToken, seriesController.getAllSeries);
  router.post('/search', seriesController.searchSeries);
  router.post('/create', validateToken, seriesController.uploadImageMiddleware, seriesController.createSeries);
  router.post('/create-complete', validateToken, seriesController.createSeriesComplete);
  router.get('/genres', seriesController.getGenres);
  router.get('/demographics', seriesController.getDemographics);

  // Rutas con parámetros - DEBEN ir DESPUÉS
  router.get('/:id', seriesController.getSeriesById);
  router.put('/:id', validateToken, seriesController.uploadImageMiddleware, seriesController.updateSeries);
  router.delete('/:id', validateToken, seriesController.deleteSeries);
  router.put(
    '/:id/image',
    validateToken,
    seriesController.uploadImageMiddleware,
    seriesController.updateSeriesImage
  );

  // Rutas para relaciones
  router.post('/:id/genres', validateToken, seriesController.assignGenres);
  router.delete('/:id/genres', validateToken, seriesController.removeGenres);
  router.post('/:id/titles', validateToken, seriesController.addTitles);
  router.delete('/:id/titles', validateToken, seriesController.removeTitles);

  return {
    router,
    seriesController,
    seriesRepository,
    getProductionsUseCase,
    getProductionYearsUseCase,
    createSeriesUseCase,
    getSeriesByIdUseCase,
    updateSeriesImageUseCase,
    updateSeriesUseCase,
    getAllSeriesUseCase,
    deleteSeriesUseCase,
    searchSeriesUseCase,
    createSeriesCompleteUseCase,
    assignGenresUseCase,
    removeGenresUseCase,
    addTitlesUseCase,
    removeTitlesUseCase,
    getGenresUseCase,
    getDemographicsUseCase,
  };
}

/**
 * Composition Root con CQRS Pattern
 * Separa comandos (escritura) de queries (lectura)
 *
 * Módulo Series completamente migrado a CQRS
 * @returns Módulo Series con CQRS 100% implementado
 */
export function buildSeriesModuleWithCQRS() {
  // 1. Repositorios (separados por responsabilidad)
  const writeRepository = new SeriesWriteMysqlRepository();
  const readRepository = new SeriesReadMysqlRepository();

  // 2. Servicios de infraestructura
  const imageProcessorService = new SeriesImageProcessorService();

  // 3. Servicios de aplicación
  const imageService = new ImageService(imageProcessorService);

  // 4. Command Handlers (escritura) - CQRS
  const createSeriesHandler = new CreateSeriesHandler(writeRepository, imageService);
  const updateSeriesHandler = new UpdateSeriesHandler(writeRepository, readRepository);
  const deleteSeriesHandler = new DeleteSeriesHandler(writeRepository, readRepository, imageService);
  const assignGenresHandler = new AssignGenresHandler(writeRepository, readRepository);
  const removeGenresHandler = new RemoveGenresHandler(writeRepository, readRepository);
  const addTitlesHandler = new AddTitlesHandler(writeRepository, readRepository);
  const removeTitlesHandler = new RemoveTitlesHandler(writeRepository, readRepository);
  const createSeriesCompleteHandler = new CreateSeriesCompleteHandler(writeRepository, readRepository);
  const updateSeriesImageHandler = new UpdateSeriesImageHandler(writeRepository, readRepository, imageService);

  // 5. Query Handlers (lectura) - CQRS
  const getSeriesByIdHandler = new GetSeriesByIdHandler(readRepository);
  const searchSeriesHandler = new SearchSeriesHandler(readRepository);
  const getAllSeriesHandler = new GetAllSeriesHandler(readRepository);
  const getGenresHandler = new GetGenresHandler(readRepository);
  const getDemographicsHandler = new GetDemographicsHandler(readRepository);
  const getProductionYearsHandler = new GetProductionYearsHandler(readRepository);
  const getProductionsHandler = new GetProductionsHandler(readRepository);

  // 6. Controlador CQRS (100% CQRS)
  const seriesCQRSController = new SeriesCQRSController(
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

  // 7. Configurar rutas (mismas rutas que el módulo anterior, pero con CQRS 100%)
  const router = Router();

  // Rutas específicas (sin parámetros) - DEBEN ir ANTES
  router.post('/', seriesCQRSController.getProductions); // Boot endpoint
  router.get('/years', seriesCQRSController.getProductionYears);
  router.get('/list', validateToken, seriesCQRSController.getAllSeries);
  router.post('/search', seriesCQRSController.searchSeries);
  router.post(
    '/create',
    validateToken,
    seriesCQRSController.uploadImageMiddleware,
    seriesCQRSController.createSeries
  );
  router.post('/create-complete', validateToken, seriesCQRSController.createSeriesComplete);
  router.get('/genres', seriesCQRSController.getGenres);
  router.get('/demographics', seriesCQRSController.getDemographics);

  // Rutas con parámetros - DEBEN ir DESPUÉS
  router.get('/:id', seriesCQRSController.getSeriesById);
  router.put('/:id', validateToken, seriesCQRSController.uploadImageMiddleware, seriesCQRSController.updateSeries);
  router.delete('/:id', validateToken, seriesCQRSController.deleteSeries);
  router.put(
    '/:id/image',
    validateToken,
    seriesCQRSController.uploadImageMiddleware,
    seriesCQRSController.updateSeriesImage
  );

  // Rutas para relaciones
  router.post('/:id/genres', validateToken, seriesCQRSController.assignGenres);
  router.delete('/:id/genres', validateToken, seriesCQRSController.removeGenres);
  router.post('/:id/titles', validateToken, seriesCQRSController.addTitles);
  router.delete('/:id/titles', validateToken, seriesCQRSController.removeTitles);

  return {
    router,
    seriesCQRSController,
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
