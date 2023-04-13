import { Router } from 'express';
import { getDefault } from './default.controller';

const router = Router();
router.get('/', getDefault);
export default router;
