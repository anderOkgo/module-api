import { router } from '../../../helpers/middle.helper';
import { getTotalBank } from './finan.controller';

router.post('/', getTotalBank);
router.get('/totalbank', getTotalBank);

export default router;
