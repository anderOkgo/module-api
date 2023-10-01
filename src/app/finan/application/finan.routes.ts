import validateToken from '../../../helpers/validate-token.helper';
import { router } from '../../../helpers/middle.helper';
import { getTotalBank, putMoviment, defaultFInan } from './finan.controller';

router.get('/finan', defaultFInan);
router.post('/finan/totalbank', validateToken, getTotalBank);
router.put('/finan/insert', validateToken, putMoviment);

export default router;
