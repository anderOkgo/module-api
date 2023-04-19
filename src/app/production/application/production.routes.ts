import { Router } from 'express';
import { getProductions, getProductionYear } from './production.controller';
//import validateToken from '../../auth/domain/validate-token';

const router = Router();

router.post('/', getProductions);
router.get('/years', /*validateToken,*/ getProductionYear);

export default router;
