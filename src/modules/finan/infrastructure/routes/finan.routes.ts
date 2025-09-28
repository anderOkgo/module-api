import validateToken from '../../../../infrastructure/lib/validate-token';
import { Router } from 'express';
const router = Router();
import { getInitialLoad, putMovement, updateMovement, deleteMovement } from '../controllers/finan.controller';

router.post('/initial-load', validateToken, getInitialLoad);
router.post('/insert', validateToken, putMovement);
router.put('/update/:id', validateToken, updateMovement);
router.delete('/delete/:id', validateToken, deleteMovement);

export default router;
