import { Router } from 'express';
import { getProductions, getProductionYears } from './production.controller';
import validateToken from '../../auth/application/validate-token';

const router = Router();

router.post('/', getProductions);
router.get('/years', /*validateToken,*/ getProductionYears);

export default router;
