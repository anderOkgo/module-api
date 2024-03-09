import validateToken from '../../../helpers/validate-token.helper';
import { router } from '../../../helpers/middle.helper';
import { getTotalBank, putMoviment, updateMoviment, deleteMoviment, defaultFInan } from './finan.controller';

router.get('/finan', defaultFInan);
router.post('/finan/totalbank', validateToken, getTotalBank);
router.post('/finan/insert', validateToken, putMoviment);
router.put('/finan/update/:id', validateToken, updateMoviment);
router.delete('/finan/delete/:id', validateToken, deleteMoviment);

export default router;
