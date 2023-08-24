import { router } from '../../../helpers/middle.helper';
import { getProductions, getProductionYears } from './production.controller';
//import validateToken from '../../auth/domain/validate-token';

router.post('/', getProductions);
router.get('/years', /*validateToken,*/ getProductionYears);

export default router;
