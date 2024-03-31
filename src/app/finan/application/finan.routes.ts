import validateToken from '../../../helpers/validate-token.helper';
import { router } from '../../../helpers/middle.helper';
import { getTotalBank, putMovement, updateMovement, deleteMovement, defaultFInan } from './finan.controller';

router.get('/finan', defaultFInan);
router.post('/finan/totalbank', validateToken, getTotalBank);
router.post('/finan/insert', validateToken, putMovement);
router.put('/finan/update/:id', validateToken, updateMovement);
router.delete('/finan/delete/:id', validateToken, deleteMovement);

export default router;
