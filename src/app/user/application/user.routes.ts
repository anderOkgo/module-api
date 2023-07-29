import { router } from '../../../helpers/middle.helper';
import { addUsers, loginUsers } from './user.controller';

router.post('/', addUsers);
router.post('/login', loginUsers);

export default router;
