import { Router } from 'express';
import { getProductions, getProductionYears } from '../controllers/production.controller';
import validateToken from './validate-token';

const router = Router();

router.post('/', getProductions);
router.get('/years', validateToken, getProductionYears);

export default router;