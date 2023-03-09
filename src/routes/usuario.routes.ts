import { Router } from 'express';
import { addUsuario, loginUser } from '../controllers/usuario.controller';

const router = Router();

router.post('/', addUsuario);
router.post('/login', loginUser)

export default router;