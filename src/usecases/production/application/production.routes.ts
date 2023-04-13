import { Router } from 'express';
import { getProductions, getProductionYears } from './production.controller';
//import validateToken from '../../auth/domain/validate-token';

const router = Router();

router.post('/', getProductions);
router.get('/years', /*validateToken,*/ getProductionYears);

export default router;
