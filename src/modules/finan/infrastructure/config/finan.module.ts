import { Router } from 'express';
import validateToken from '../../../../infrastructure/services/validate-token';
import { FinanController } from '../controllers/finan.controller';
import { GetInitialLoadUseCase } from '../../application/use-cases/get-initial-load.use-case';
import { PutMovementUseCase } from '../../application/use-cases/put-movement.use-case';
import { UpdateMovementUseCase } from '../../application/use-cases/update-movement.use-case';
import { DeleteMovementUseCase } from '../../application/use-cases/delete-movement.use-case';
import { FinanMysqlRepository } from '../persistence/finan.mysql';

/**
 * Composition Root para el módulo Finan
 * Construye y cablea las dependencias usando Clean Architecture
 * Sigue el patrón hexagonal con inyección de dependencias
 */
export function buildFinanModule() {
  // 1. Crear repositorio (Infrastructure Layer)
  const finanRepository = new FinanMysqlRepository();

  // 2. Crear Use Cases (Application Layer) - inyectando dependencias
  const getInitialLoadUseCase = new GetInitialLoadUseCase(finanRepository);
  const putMovementUseCase = new PutMovementUseCase(finanRepository);
  const updateMovementUseCase = new UpdateMovementUseCase(finanRepository);
  const deleteMovementUseCase = new DeleteMovementUseCase(finanRepository);

  // 3. Crear Controlador (Infrastructure Layer) - inyectando Use Cases
  const finanController = new FinanController(
    getInitialLoadUseCase,
    putMovementUseCase,
    updateMovementUseCase,
    deleteMovementUseCase
  );

  // 4. Configurar rutas
  const router = Router();
  router.post('/initial-load', validateToken, finanController.getInitialLoad);
  router.post('/insert', validateToken, finanController.putMovement);
  router.put('/update/:id', validateToken, finanController.updateMovement);
  router.delete('/delete/:id', validateToken, finanController.deleteMovement);

  return {
    router,
    finanController,
    finanRepository,
    getInitialLoadUseCase,
    putMovementUseCase,
    updateMovementUseCase,
    deleteMovementUseCase,
  };
}
