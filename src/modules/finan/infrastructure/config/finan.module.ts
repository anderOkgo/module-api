import { Router } from 'express';
import validateToken from '../../../../infrastructure/lib/validate-token';
import { getInitialLoad, putMovement, updateMovement, deleteMovement } from '../controllers/finan.controller';

export function buildFinanModule() {
  const router = Router();

  // Usar controladores EXISTENTES (con Swagger)
  router.post('/initial-load', validateToken, getInitialLoad);
  router.post('/insert', validateToken, putMovement);
  router.put('/update/:id', validateToken, updateMovement);
  router.delete('/delete/:id', validateToken, deleteMovement);

  return { router };
}
