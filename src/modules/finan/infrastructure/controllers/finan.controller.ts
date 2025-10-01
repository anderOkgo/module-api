import { Request, Response } from 'express';
import { GetInitialLoadUseCase } from '../../application/use-cases/get-initial-load.use-case';
import { PutMovementUseCase } from '../../application/use-cases/put-movement.use-case';
import { UpdateMovementUseCase } from '../../application/use-cases/update-movement.use-case';
import { DeleteMovementUseCase } from '../../application/use-cases/delete-movement.use-case';
import { validatePutMovement, validateGetInitialLoad } from '../validation/finan.validation';

/**
 * FinanController con inyección de dependencias
 * Sigue el patrón hexagonal/clean architecture
 */
export class FinanController {
  constructor(
    private readonly getInitialLoadUseCase: GetInitialLoadUseCase,
    private readonly putMovementUseCase: PutMovementUseCase,
    private readonly updateMovementUseCase: UpdateMovementUseCase,
    private readonly deleteMovementUseCase: DeleteMovementUseCase
  ) {}

  /**
   * Obtener carga inicial de datos financieros
   * Documentación Swagger: finan.swagger.ts
   */
  getInitialLoad = async (req: Request, res: Response) => {
    const validation = validateGetInitialLoad(req.body);
    if (validation.error) return res.status(400).json(validation.errors);

    try {
      const resp = await this.getInitialLoadUseCase.execute(req.body);
      return resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
    } catch (error) {
      console.error('Error in getInitialLoad:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  };

  /**
   * Crear nuevo movimiento financiero
   * Documentación Swagger: finan.swagger.ts
   */
  putMovement = async (req: Request, res: Response) => {
    const validation = validatePutMovement(req.body);
    if (validation.error) return res.status(400).json(validation.errors);

    try {
      const resp = await this.putMovementUseCase.execute(req.body);
      return resp.errorSys ? res.status(500).json(resp.message) : res.status(201).json(resp);
    } catch (error) {
      console.error('Error in putMovement:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  };

  /**
   * Actualizar movimiento financiero
   * Documentación Swagger: finan.swagger.ts
   */
  updateMovement = async (req: Request, res: Response) => {
    const validation = validatePutMovement(req.body);
    if (validation.error) return res.status(400).json(validation.errors);

    try {
      const id = parseInt(req.params.id);
      const resp = await this.updateMovementUseCase.execute(id, req.body);
      return resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
    } catch (error) {
      console.error('Error in updateMovement:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  };

  /**
   * Eliminar movimiento financiero
   * Documentación Swagger: finan.swagger.ts
   */
  deleteMovement = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const username = req.body.username || 'default'; // Fallback para username
      const resp = await this.deleteMovementUseCase.execute(id, username);
      return resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
    } catch (error) {
      console.error('Error in deleteMovement:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  };
}
