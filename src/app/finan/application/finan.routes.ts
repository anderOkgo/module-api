import validateToken from '../../../helpers/validate-token.helper';
import { router } from '../../../helpers/middle.helper';
import { getInitialLoads, putMovements, updateMovements, deleteMovements, defaultFInan } from './finan.controller';

router.get('/finan', defaultFInan);
router.post('/finan/initial-load', validateToken, getInitialLoads);
router.post('/finan/insert', validateToken, putMovements);
router.put('/finan/update/:id', validateToken, updateMovements);
router.delete('/finan/delete/:id', validateToken, deleteMovements);

export default router;
