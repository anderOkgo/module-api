import { Router } from 'express';
import { addUsers, loginUsers } from './user.controller';

const router = Router();

router.post('/', addUsers);
router.post('/login', loginUsers);

export default router;
