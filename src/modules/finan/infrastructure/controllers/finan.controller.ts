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
   * @swagger
   * /api/finan/initial-load:
   *   post:
   *     summary: Obtener carga inicial de datos financieros
   *     tags: [Finance]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currency
   *             properties:
   *               currency:
   *                 type: string
   *                 description: Código de moneda (3 caracteres)
   *                 example: "AUD"
   *                 minLength: 3
   *                 maxLength: 3
   *               date:
   *                 type: string
   *                 format: date
   *                 description: Fecha para filtrar datos (opcional)
   *                 example: "2023-12-25"
   *               username:
   *                 type: string
   *                 description: Nombre de usuario (opcional)
   *                 example: "anderokgo"
   *     responses:
   *       200:
   *         description: Datos financieros obtenidos exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                   example: false
   *                 data:
   *                   type: object
   *                   properties:
   *                     movements:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: number
   *                             example: 1
   *                           movement_name:
   *                             type: string
   *                             example: "Compra de comida"
   *                           movement_val:
   *                             type: number
   *                             example: 25.50
   *       400:
   *         description: Error en la validación
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   * @swagger
   * /api/finan/insert:
   *   post:
   *     summary: Insertar nuevo movimiento financiero
   *     tags: [Finance]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - movement_name
   *               - movement_val
   *               - movement_date
   *               - movement_type
   *               - movement_tag
   *               - currency
   *             properties:
   *               movement_name:
   *                 type: string
   *                 description: Nombre del movimiento
   *                 example: "Compra de comida"
   *               movement_val:
   *                 type: number
   *                 description: Valor del movimiento
   *                 example: 25.50
   *               movement_date:
   *                 type: string
   *                 format: date
   *                 description: Fecha del movimiento
   *                 example: "2024-01-15"
   *               movement_type:
   *                 type: number
   *                 description: Tipo de movimiento
   *                 example: 1
   *               movement_tag:
   *                 type: string
   *                 description: Etiqueta del movimiento
   *                 example: "food"
   *               currency:
   *                 type: string
   *                 description: Moneda
   *                 example: "USD"
   *     responses:
   *       201:
   *         description: Movimiento insertado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Movimiento insertado exitosamente"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: number
   *                       example: 1
   *       400:
   *         description: Error en la validación
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   * @swagger
   * /api/finan/update/{id}:
   *   put:
   *     summary: Actualizar movimiento financiero
   *     tags: [Finance]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del movimiento
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               movement_name:
   *                 type: string
   *                 description: Nombre del movimiento
   *                 example: "Compra de comida actualizada"
   *               movement_val:
   *                 type: number
   *                 description: Valor del movimiento
   *                 example: 30.00
   *               movement_date:
   *                 type: string
   *                 format: date
   *                 description: Fecha del movimiento
   *                 example: "2024-01-15"
   *               movement_type:
   *                 type: number
   *                 description: Tipo de movimiento
   *                 example: 1
   *               movement_tag:
   *                 type: string
   *                 description: Etiqueta del movimiento
   *                 example: "food"
   *               currency:
   *                 type: string
   *                 description: Moneda
   *                 example: "USD"
   *     responses:
   *       200:
   *         description: Movimiento actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Movimiento actualizado exitosamente"
   *       400:
   *         description: Error en la validación
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Movimiento no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   * @swagger
   * /api/finan/delete/{id}:
   *   delete:
   *     summary: Eliminar movimiento financiero
   *     tags: [Finance]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del movimiento
   *         example: 1
   *     responses:
   *       200:
   *         description: Movimiento eliminado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Movimiento eliminado exitosamente"
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Movimiento no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
