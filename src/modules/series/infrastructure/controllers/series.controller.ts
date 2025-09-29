import { Request, Response } from 'express';
import { GetProductionsUseCase } from '../../application/use-cases/get-productions.use-case';
import { GetProductionYearsUseCase } from '../../application/use-cases/get-production-years.use-case';
import { CreateSeriesUseCase } from '../../application/use-cases/create-series.use-case';
import { GetSeriesByIdUseCase } from '../../application/use-cases/get-series-by-id.use-case';
import { UpdateSeriesImageUseCase } from '../../application/use-cases/update-series-image.use-case';
import { ProductionMysqlRepository } from '../persistence/series.mysql';
import { validateProduction } from '../validation/series.validation';
import { uploadMiddleware } from '../../../../infrastructure/lib/upload';
import { ImageProcessor } from '../../../../infrastructure/lib/image';
import path from 'path';
import { SeriesCreateRequest, SeriesUpdateRequest } from '../../domain/entities/series.entity';

// Documentación Swagger eliminada - endpoint /api/series/series removido
// Función defaultSeries eliminada - usar /health endpoint en su lugar

/**
 * @swagger
 * /api/series:
 *   post:
 *     summary: Obtener producciones con filtros (Boot endpoint)
 *     tags: [Series]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               production_name:
 *                 type: string
 *                 description: Nombre de la producción (búsqueda parcial)
 *                 example: "Attack on Titan"
 *               production_year:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Años de producción para filtrar
 *                 example: [2013, 2014, 2015]
 *               demographic_name:
 *                 type: string
 *                 description: Nombre de la demografía
 *                 example: "Shōnen"
 *               limit:
 *                 type: string
 *                 description: Límite de resultados
 *                 example: "50"
 *     responses:
 *       200:
 *         description: Lista de producciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Series'
 *               example:
 *                 - id: 1
 *                   name: "Attack on Titan"
 *                   chapter_numer: 25
 *                   year: 2013
 *                   description: "Una serie de anime sobre la humanidad luchando contra titanes"
 *                   qualification: 9.5
 *                   image: "/img/tarjeta/1.jpg"
 *                   demography_id: 2
 *                   visible: 1
 *                   rank: 1
 *                   demographic_name: "Shōnen"
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
export const getProductions = async (req: Request, res: Response) => {
  const validationResult = validateProduction(req.body);
  if (!validationResult.valid) return res.status(400).json(validationResult.errors);

  try {
    const getProductionsUseCase = new GetProductionsUseCase();
    const resp = await getProductionsUseCase.execute(validationResult.result);
    return res.status(200).json(resp);
  } catch (error) {
    console.error('Error in getProductions:', error);
    return res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

/**
 * @swagger
 * /api/series/years:
 *   get:
 *     summary: Obtener todos los años de producción disponibles
 *     tags: [Series]
 *     responses:
 *       200:
 *         description: Lista de años obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: number
 *                   example: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023]
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getProductionYears = async (req: Request, res: Response) => {
  try {
    const getProductionYearsUseCase = new GetProductionYearsUseCase();
    const resp = await getProductionYearsUseCase.execute();
    return res.status(200).json(resp);
  } catch (error) {
    console.error('Error in getProductionYears:', error);
    return res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

// Controladores CRUD - usar repositorio directamente
const repository = new ProductionMysqlRepository();

/**
 * @swagger
 * /api/series/create:
 *   post:
 *     summary: Crear una nueva serie
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - chapter_number
 *               - year
 *               - description
 *               - qualification
 *               - demography_id
 *               - visible
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre de la serie
 *                 example: "Attack on Titan"
 *               chapter_number:
 *                 type: number
 *                 description: Número de capítulos
 *                 example: 25
 *               year:
 *                 type: number
 *                 description: Año de lanzamiento
 *                 example: 2013
 *               description:
 *                 type: string
 *                 description: Descripción de la serie
 *                 example: "Una serie de anime sobre la humanidad luchando contra titanes"
 *               qualification:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *                 description: Calificación de 0 a 10
 *                 example: 9.5
 *               demography_id:
 *                 type: number
 *                 description: ID de la demografía
 *                 example: 1
 *               visible:
 *                 type: boolean
 *                 description: Si la serie es visible
 *                 example: true
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de la serie (será optimizada a 190x285px, ~14KB)
 *     responses:
 *       201:
 *         description: Serie creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Series'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 */
export const createSeries = async (req: Request, res: Response) => {
  try {
    const validationResult = validateSeriesCreate(req.body);
    if (!validationResult.valid) {
      return res.status(400).json({
        error: 'Datos de validación incorrectos',
        details: validationResult.errors,
      });
    }

    const imageBuffer = req.file ? req.file.buffer : undefined;
    const createSeriesUseCase = new CreateSeriesUseCase();
    const series = await createSeriesUseCase.execute(validationResult.result!, imageBuffer);

    return res.status(201).json({
      message: 'Serie creada exitosamente',
      data: series,
    });
  } catch (error) {
    console.error('Error creating series:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * @swagger
 * /api/series/{id}:
 *   get:
 *     summary: Obtener serie por ID
 *     tags: [Series]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la serie
 *         example: 1
 *     responses:
 *       200:
 *         description: Serie obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Series'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Serie no encontrada
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
export const getSeriesById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const series = await repository.findById(id);
    if (!series) {
      return res.status(404).json({ error: 'Serie no encontrada' });
    }

    return res.status(200).json({ data: series });
  } catch (error) {
    console.error('Error getting series:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * @swagger
 * /api/series/list:
 *   get:
 *     summary: Obtener todas las series
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Número máximo de series a retornar
 *         example: 25
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Número de series a omitir (para paginación)
 *         example: 0
 *     responses:
 *       200:
 *         description: Lista de series obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Series'
 *                   example:
 *                     - id: 1
 *                       name: "Attack on Titan"
 *                       chapter_numer: 25
 *                       year: 2013
 *                       description: "Una serie de anime sobre la humanidad luchando contra titanes"
 *                       qualification: 9.5
 *                       image: "/img/tarjeta/1.jpg"
 *                       demography_id: 2
 *                       visible: 1
 *                       rank: 1
 *                       demographic_name: "Shōnen"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getAllSeries = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const series = await repository.findAll(limit, offset);
    return res.status(200).json({ data: series });
  } catch (error) {
    console.error('Error getting series:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * @swagger
 * /api/series/{id}:
 *   put:
 *     summary: Actualizar serie existente
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la serie a actualizar
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre de la serie
 *                 example: "Attack on Titan Season 2"
 *               chapter_number:
 *                 type: number
 *                 description: Número de capítulos
 *                 example: 12
 *               year:
 *                 type: number
 *                 description: Año de lanzamiento
 *                 example: 2017
 *               description:
 *                 type: string
 *                 description: Descripción de la serie
 *                 example: "Segunda temporada de Attack on Titan"
 *               qualification:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *                 description: Calificación de 0 a 10
 *                 example: 9.8
 *               demography_id:
 *                 type: number
 *                 description: ID de la demografía
 *                 example: 1
 *               visible:
 *                 type: boolean
 *                 description: Si la serie es visible
 *                 example: true
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Nueva imagen de la serie (opcional)
 *     responses:
 *       200:
 *         description: Serie actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Series'
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
export const updateSeries = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const validationResult = validateSeriesUpdate({ ...req.body, id });
    if (!validationResult.valid) {
      return res.status(400).json({
        error: 'Datos de validación incorrectos',
        details: validationResult.errors,
      });
    }

    const series = await repository.update(id, validationResult.result!);

    return res.status(200).json({
      message: 'Serie actualizada exitosamente',
      data: series,
    });
  } catch (error) {
    console.error('Error updating series:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * @swagger
 * /api/series/{id}:
 *   delete:
 *     summary: Eliminar serie
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la serie a eliminar
 *         example: 1
 *     responses:
 *       200:
 *         description: Serie eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Serie eliminada exitosamente"
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Serie no encontrada
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
export const deleteSeries = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const deleted = await repository.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Serie no encontrada' });
    }

    return res.status(200).json({ message: 'Serie eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting series:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * @swagger
 * /api/series/search:
 *   post:
 *     summary: Buscar series con filtros
 *     tags: [Series]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               production_name:
 *                 type: string
 *                 description: Nombre de la serie (búsqueda parcial)
 *                 example: "Attack on Titan"
 *               production_year:
 *                 type: number
 *                 description: Año de producción
 *                 example: 2013
 *               demography_id:
 *                 type: number
 *                 description: ID de la demografía (1=Kodomo, 2=Shōnen, 3=Shōjo, 4=Seinen, 5=Josei, 6=Shōnen-Seinen)
 *                 example: 2
 *               visible:
 *                 type: boolean
 *                 description: Si la serie es visible
 *                 example: true
 *               qualification:
 *                 type: number
 *                 description: Calificación mínima (0-10)
 *                 example: 8.5
 *               chapter_number:
 *                 type: number
 *                 description: Número de capítulos
 *                 example: 25
 *     responses:
 *       200:
 *         description: Búsqueda realizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Series'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const searchSeries = async (req: Request, res: Response) => {
  try {
    const filters = req.body;
    const series = await repository.search(filters);
    return res.status(200).json({ data: series });
  } catch (error) {
    console.error('Error searching series:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * @swagger
 * /api/series/{id}/image:
 *   put:
 *     summary: Actualizar imagen de serie
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la serie
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Nueva imagen de la serie (será optimizada a 190x285px, ~14KB)
 *     responses:
 *       200:
 *         description: Imagen actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Series'
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
export const updateSeriesImage = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó imagen' });
    }

    // Usar Use Case que maneja toda la lógica de imágenes
    const updateImageUseCase = new UpdateSeriesImageUseCase();
    const series = await updateImageUseCase.execute(id, req.file.buffer);
    return res.status(200).json({
      message: 'Imagen actualizada exitosamente',
      data: series,
    });
  } catch (error) {
    console.error('Error updating series image:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

// Funciones de validación
const validateSeriesCreate = (data: any) => {
  const errors: string[] = [];

  // Convertir tipos para multipart/form-data
  const processedData = {
    name: data.name,
    chapter_number: data.chapter_number ? parseInt(data.chapter_number) : undefined,
    year: data.year ? parseInt(data.year) : undefined,
    description: data.description,
    qualification: data.qualification ? parseFloat(data.qualification) : undefined,
    demography_id: data.demography_id ? parseInt(data.demography_id) : undefined,
    visible: data.visible === 'true' || data.visible === true,
  };

  if (!processedData.name || typeof processedData.name !== 'string' || processedData.name.trim().length === 0) {
    errors.push('El nombre es requerido y debe ser una cadena no vacía');
  }

  if (
    !processedData.chapter_number ||
    typeof processedData.chapter_number !== 'number' ||
    processedData.chapter_number < 1
  ) {
    errors.push('El número de capítulos es requerido y debe ser un número positivo');
  }

  if (
    !processedData.year ||
    typeof processedData.year !== 'number' ||
    processedData.year < 1900 ||
    processedData.year > new Date().getFullYear() + 1
  ) {
    errors.push('El año es requerido y debe ser un año válido');
  }

  if (
    !processedData.description ||
    typeof processedData.description !== 'string' ||
    processedData.description.trim().length === 0
  ) {
    errors.push('La descripción es requerida y debe ser una cadena no vacía');
  }

  if (
    processedData.qualification === undefined ||
    typeof processedData.qualification !== 'number' ||
    processedData.qualification < 0 ||
    processedData.qualification > 10
  ) {
    errors.push('La calificación es requerida y debe ser un número entre 0 y 10');
  }

  if (
    !processedData.demography_id ||
    typeof processedData.demography_id !== 'number' ||
    processedData.demography_id < 1
  ) {
    errors.push('El ID de demografía es requerido y debe ser un número positivo');
  }

  if (processedData.visible === undefined || typeof processedData.visible !== 'boolean') {
    errors.push('El campo visible es requerido y debe ser un booleano');
  }

  return {
    valid: errors.length === 0,
    errors,
    result: errors.length === 0 ? (processedData as SeriesCreateRequest) : undefined,
  };
};

const validateSeriesUpdate = (data: any) => {
  const errors: string[] = [];

  // Convertir tipos para multipart/form-data
  const processedData = {
    id: data.id ? parseInt(data.id) : undefined,
    name: data.name,
    chapter_number: data.chapter_number ? parseInt(data.chapter_number) : undefined,
    year: data.year ? parseInt(data.year) : undefined,
    description: data.description,
    qualification: data.qualification ? parseFloat(data.qualification) : undefined,
    demography_id: data.demography_id ? parseInt(data.demography_id) : undefined,
    visible: data.visible !== undefined ? data.visible === 'true' || data.visible === true : undefined,
  };

  if (!processedData.id || typeof processedData.id !== 'number' || processedData.id < 1) {
    errors.push('El ID es requerido y debe ser un número positivo');
  }

  if (
    processedData.name !== undefined &&
    (typeof processedData.name !== 'string' || processedData.name.trim().length === 0)
  ) {
    errors.push('El nombre debe ser una cadena no vacía');
  }

  if (
    processedData.chapter_number !== undefined &&
    (typeof processedData.chapter_number !== 'number' || processedData.chapter_number < 1)
  ) {
    errors.push('El número de capítulos debe ser un número positivo');
  }

  if (
    processedData.year !== undefined &&
    (typeof processedData.year !== 'number' ||
      processedData.year < 1900 ||
      processedData.year > new Date().getFullYear() + 1)
  ) {
    errors.push('El año debe ser un año válido');
  }

  if (
    processedData.description !== undefined &&
    (typeof processedData.description !== 'string' || processedData.description.trim().length === 0)
  ) {
    errors.push('La descripción debe ser una cadena no vacía');
  }

  if (
    processedData.qualification !== undefined &&
    (typeof processedData.qualification !== 'number' ||
      processedData.qualification < 0 ||
      processedData.qualification > 10)
  ) {
    errors.push('La calificación debe ser un número entre 0 y 10');
  }

  if (
    processedData.demography_id !== undefined &&
    (typeof processedData.demography_id !== 'number' || processedData.demography_id < 1)
  ) {
    errors.push('El ID de demografía debe ser un número positivo');
  }

  if (processedData.visible !== undefined && typeof processedData.visible !== 'boolean') {
    errors.push('El campo visible debe ser un booleano');
  }

  return {
    valid: errors.length === 0,
    errors,
    result: errors.length === 0 ? (processedData as SeriesUpdateRequest) : undefined,
  };
};

export const uploadImageMiddleware = uploadMiddleware;
