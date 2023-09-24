import validateToken from '../../../helpers/lib/validate-token';
import { router } from '../../../helpers/middle.helper';
import { getTotalBank, putMoviment } from './finan.controller';

router.post('/', getTotalBank);
router.post('/totalbank', validateToken, getTotalBank);
router.put('/insert', validateToken, putMoviment);

export default router;
