import { Request, Response } from 'express';
import { GetInitialLoadUseCase } from '../../application/use-cases/get-initial-load.use-case';
import { PutMovementUseCase } from '../../application/use-cases/put-movement.use-case';
import { UpdateMovementUseCase } from '../../application/use-cases/update-movement.use-case';
import { DeleteMovementUseCase } from '../../application/use-cases/delete-movement.use-case';
import { validatePutMovement, validateGetInitialLoad } from '../validation/finan.validation';

/**
 * FinanController with dependency injection
 * Follows hexagonal/clean architecture pattern
 */
export class FinanController {
  constructor(
    private readonly getInitialLoadUseCase: GetInitialLoadUseCase,
    private readonly putMovementUseCase: PutMovementUseCase,
    private readonly updateMovementUseCase: UpdateMovementUseCase,
    private readonly deleteMovementUseCase: DeleteMovementUseCase
  ) {}

  /**
   * Get initial load of financial data
   * Swagger documentation: finan.swagger.ts
   */
  getInitialLoad = async (req: Request, res: Response) => {
    const validation = validateGetInitialLoad(req.body);
    if (validation.error) return res.status(400).json(validation.errors);

    try {
      const resp = await this.getInitialLoadUseCase.execute(req.body);
      return res.status(200).json({
        message: 'Initial load data retrieved successfully',
        data: resp,
      });
    } catch (error) {
      console.error('Error in getInitialLoad:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  };

  /**
   * Create new financial movement
   * Swagger documentation: finan.swagger.ts
   */
  putMovement = async (req: Request, res: Response) => {
    const validation = validatePutMovement(req.body);
    if (validation.error) return res.status(400).json(validation.errors);

    try {
      const resp = await this.putMovementUseCase.execute(req.body);

      if (!resp.success) {
        return res.status(400).json({
          error: true,
          message: resp.message,
        });
      }

      return res.status(201).json({
        message: resp.message,
        data: resp.data,
      });
    } catch (error) {
      console.error('Error in putMovement:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  };

  /**
   * Update financial movement
   * Swagger documentation: finan.swagger.ts
   */
  updateMovement = async (req: Request, res: Response) => {
    const validation = validatePutMovement(req.body);
    if (validation.error) return res.status(400).json(validation.errors);

    try {
      const id = parseInt(req.params.id);
      const username = req.body.username || 'default'; // Fallback for username
      const resp = await this.updateMovementUseCase.execute(id, req.body, username);

      if (!resp.success) {
        return res.status(400).json({
          error: true,
          message: resp.message,
        });
      }

      return res.status(200).json({
        message: resp.message,
        data: resp.data,
      });
    } catch (error) {
      console.error('Error in updateMovement:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  };

  /**
   * Delete financial movement
   * Swagger documentation: finan.swagger.ts
   */
  deleteMovement = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const username = req.body.username || 'default'; // Fallback for username
      const resp = await this.deleteMovementUseCase.execute(id, username);

      if (!resp.success) {
        return res.status(400).json({
          error: true,
          message: resp.message,
        });
      }

      return res.status(200).json({
        message: resp.message,
      });
    } catch (error) {
      console.error('Error in deleteMovement:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  };
}
