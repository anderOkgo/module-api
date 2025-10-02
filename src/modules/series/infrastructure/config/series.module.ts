import { Router } from 'express';
import validateToken from '../../../../infrastructure/services/validate-token';
import { SeriesController } from '../controllers/series.controller';
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
