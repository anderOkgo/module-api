import { Router } from 'express';
const router = Router();
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

export default router;
