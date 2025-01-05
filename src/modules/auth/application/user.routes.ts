import { router } from '../../../helpers/middle.helper';
import { addUser, loginUser, defaultUser } from './user.controller';

router.get('/users', defaultUser);
router.post('/users/add', addUser);
router.post('/users/login', loginUser);

export default router;
