import { Router } from 'express';
import { addUser, loginUser } from '../controllers/user.controller';

/**
 * Composition Root para el módulo Auth
 * Construye y cablean las dependencias usando Clean Architecture
 */
export function buildAuthModule() {
  const router = Router();

  // Rutas usando los controladores existentes que ya tienen Swagger
  router.post('/add', addUser);
  router.post('/login', loginUser);

  return { router };
}
