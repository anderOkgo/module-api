import validateToken from '../../../helpers/validate-token.helper';
import { router } from '../../../helpers/middle.helper';
import { getInitialLoad, putMovement, updateMovement, deleteMovement, defaultFInan } from './finan.controller';

router.get('/finan', defaultFInan);
router.post('/finan/initial-load', validateToken, getInitialLoad);
router.post('/finan/insert', validateToken, putMovement);
router.put('/finan/update/:id', validateToken, updateMovement);
router.delete('/finan/delete/:id', validateToken, deleteMovement);

export default router;
