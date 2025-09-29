import { Request, Response } from 'express';
import { GetInitialLoadUseCase } from '../../application/use-cases/get-initial-load.use-case';
import { PutMovementUseCase } from '../../application/use-cases/put-movement.use-case';
import { UpdateMovementUseCase } from '../../application/use-cases/update-movement.use-case';
import { DeleteMovementUseCase } from '../../application/use-cases/delete-movement.use-case';
import {
  validateGetInitialLoad,
  validatePutMovement,
  validateDeleteMovement,
  validateUpdateMovements,
  ValidationResult,
} from '../validation/finan.validation';

// Documentación Swagger eliminada - endpoint /api/finan/finan removido
// Función defaultFInan eliminada - usar /health endpoint en su lugar

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
 *                 totalExpenseDay:
 *                   type: object
 *                   description: Gastos totales del día
 *                 movements:
 *                   type: array
 *                   description: Lista de movimientos financieros
 *                   items:
 *                     type: object
 *                 movementTag:
 *                   type: array
 *                   description: Etiquetas de movimientos
 *                   items:
 *                     type: object
 *                 totalBalance:
 *                   type: object
 *                   description: Balance total
 *                 yearlyBalance:
 *                   type: object
 *                   description: Balance anual
 *                 monthlyBalance:
 *                   type: object
 *                   description: Balance mensual
 *                 balanceUntilDate:
 *                   type: object
 *                   description: Balance hasta la fecha especificada
 *                 monthlyExpensesUntilDay:
 *                   type: object
 *                   description: Gastos mensuales hasta el día actual
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getInitialLoad = async (req: Request, res: Response) => {
  const validation = validateGetInitialLoad(req.body);
  if (validation.error) return res.status(400).json(validation.errors);

  const getInitialLoadUseCase = new GetInitialLoadUseCase();
  const resp = await getInitialLoadUseCase.execute(req.body);
  return resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
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
 *                 example: "Compra de productos"
 *                 maxLength: 100
 *               movement_val:
 *                 type: number
 *                 description: Valor del movimiento (debe ser positivo)
 *                 example: 100.50
 *                 minimum: 0.01
 *                 maximum: 10000000000000000
 *               movement_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha del movimiento
 *                 example: "2023-12-25"
 *               movement_type:
 *                 type: number
 *                 description: Tipo de movimiento
 *                 example: 1
 *               movement_tag:
 *                 type: string
 *                 description: Etiqueta del movimiento
 *                 example: "compras"
 *                 maxLength: 60
 *               currency:
 *                 type: string
 *                 description: Código de moneda (3 caracteres)
 *                 example: "AUD"
 *                 minLength: 3
 *                 maxLength: 3
 *     responses:
 *       200:
 *         description: Movimiento insertado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Movimiento insertado exitosamente"
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const putMovement = async (req: Request, res: Response) => {
  const validation = validatePutMovement(req.body);
  if (validation.error) return res.status(400).json(validation.errors);

  const putMovementUseCase = new PutMovementUseCase();
  const resp = await putMovementUseCase.execute(req.body);
  return resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
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
 *         description: ID del movimiento a actualizar
 *         example: 1
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
 *                 example: "Compra actualizada"
 *                 maxLength: 100
 *               movement_val:
 *                 type: number
 *                 description: Valor del movimiento (debe ser positivo)
 *                 example: 150.75
 *                 minimum: 0.01
 *                 maximum: 10000000000000000
 *               movement_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha del movimiento
 *                 example: "2023-12-25"
 *               movement_type:
 *                 type: number
 *                 description: Tipo de movimiento
 *                 example: 1
 *               movement_tag:
 *                 type: string
 *                 description: Etiqueta del movimiento
 *                 example: "compras"
 *                 maxLength: 60
 *               currency:
 *                 type: string
 *                 description: Código de moneda (3 caracteres)
 *                 example: "AUD"
 *                 minLength: 3
 *                 maxLength: 3
 *     responses:
 *       200:
 *         description: Movimiento actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Movimiento actualizado exitosamente"
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const updateMovement = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const validation: ValidationResult = validateUpdateMovements(req.body, id);
  if (validation.error) return res.status(400).json(validation.errors);

  const updateMovementUseCase = new UpdateMovementUseCase();
  const resp = await updateMovementUseCase.execute(id, req.body);
  return resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
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
 *         description: ID del movimiento a eliminar
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre de usuario
 *                 example: "juan.perez"
 *     responses:
 *       200:
 *         description: Movimiento eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Movimiento eliminado exitosamente"
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const deleteMovement = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const username = req.body.username;
  const validation: ValidationResult = validateDeleteMovement(id);
  if (validation.error) return res.status(400).json(validation.errors);

  const deleteMovementUseCase = new DeleteMovementUseCase();
  const resp = await deleteMovementUseCase.execute(id, username);
  return resp.errorSys ? res.status(500).json(resp.message) : res.status(200).json(resp);
};
