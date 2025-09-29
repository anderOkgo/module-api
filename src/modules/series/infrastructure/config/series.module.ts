import { Router } from 'express';
import validateToken from '../../../../infrastructure/lib/validate-token';
import {
  getProductions,
  getProductionYears,
  createSeries,
  getSeriesById,
  getAllSeries,
  updateSeries,
  deleteSeries,
  searchSeries,
  updateSeriesImage,
  uploadImageMiddleware,
} from '../controllers/series.controller';

/**
 * Composition Root para el módulo Series
 * Construye y cablea las dependencias usando Clean Architecture
 */
export function buildSeriesModule() {
  const router = Router();

  // Rutas usando los controladores existentes que ya tienen Swagger
  router.post('/', getProductions);
  router.get('/years', getProductionYears);

  // Rutas CRUD
  router.post('/create', validateToken, uploadImageMiddleware, createSeries);
  router.get('/list', getAllSeries);
  router.get('/:id', getSeriesById);
  router.put('/:id', validateToken, uploadImageMiddleware, updateSeries);
  router.delete('/:id', validateToken, deleteSeries);
  router.post('/search', searchSeries);
  router.put('/:id/image', validateToken, uploadImageMiddleware, updateSeriesImage);

  return { router };
}
