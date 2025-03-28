import { router } from '../../../infrastructure/middle.helper';
import { getDefault } from './default.controller';

router.get('/', getDefault);

export default router;
