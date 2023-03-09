import { Router } from 'express';
import { getProductions } from '../controllers/production.controller';
import validateToken from './validate-token';

const router = Router();

router.get('/', validateToken, getProductions);

export default router;
