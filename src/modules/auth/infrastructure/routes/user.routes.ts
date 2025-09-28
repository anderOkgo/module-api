import { Router } from 'express';
const router = Router();
import { addUser, loginUser } from '../controllers/user.controller';
router.post('/add', addUser);
router.post('/login', loginUser);

export default router;
