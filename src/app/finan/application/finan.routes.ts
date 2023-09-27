import validateToken from '../../../helpers/lib/validate-token';
import { router } from '../../../helpers/middle.helper';
import { getTotalBank, putMoviment, defaultFInan } from './finan.controller';

router.get('/finan', defaultFInan);
router.get('/finan/totalbank', validateToken, getTotalBank);
router.put('/finan/insert', validateToken, putMoviment);

export default router;
