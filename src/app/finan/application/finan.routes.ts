import { router } from '../../../helpers/middle.helper';
import { getTotalBank, putMoviment } from './finan.controller';

router.post('/', getTotalBank);
router.post('/totalbank', getTotalBank);
router.put('/insert', putMoviment);

export default router;
