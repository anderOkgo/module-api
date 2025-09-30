import { Request, Response } from 'express';
import { GetProductionsUseCase } from '../../application/use-cases/get-productions.use-case';
import { GetProductionYearsUseCase } from '../../application/use-cases/get-production-years.use-case';
import { CreateSeriesUseCase } from '../../application/use-cases/create-series.use-case';
import { GetSeriesByIdUseCase } from '../../application/use-cases/get-series-by-id.use-case';
import { UpdateSeriesImageUseCase } from '../../application/use-cases/update-series-image.use-case';
import { UpdateSeriesUseCase } from '../../application/use-cases/update-series.use-case';
import { GetAllSeriesUseCase } from '../../application/use-cases/get-all-series.use-case';
import { DeleteSeriesUseCase } from '../../application/use-cases/delete-series.use-case';
import { SearchSeriesUseCase } from '../../application/use-cases/search-series.use-case';
import {
  CreateSeriesCompleteUseCase,
  CreateSeriesCompleteRequest,
} from '../../application/use-cases/create-series-complete.use-case';
import { AssignGenresUseCase } from '../../application/use-cases/assign-genres.use-case';
import { RemoveGenresUseCase } from '../../application/use-cases/remove-genres.use-case';
import { AddTitlesUseCase } from '../../application/use-cases/add-titles.use-case';
import { RemoveTitlesUseCase } from '../../application/use-cases/remove-titles.use-case';
import { GetGenresUseCase } from '../../application/use-cases/get-genres.use-case';
import { GetDemographicsUseCase } from '../../application/use-cases/get-demographics.use-case';
import { validateProduction } from '../validation/series.validation';
import { uploadMiddleware } from '../../../../infrastructure/services/upload';
import { ImageProcessor } from '../../../../infrastructure/services/image';
import path from 'path';
import { SeriesCreateRequest, SeriesUpdateRequest } from '../../domain/entities/series.entity';

/**
 * SeriesController con inyección de dependencias
 * Sigue el patrón hexagonal/clean architecture
 */
export class SeriesController {
  constructor(
    private readonly getProductionsUseCase: GetProductionsUseCase,
    private readonly getProductionYearsUseCase: GetProductionYearsUseCase,
    private readonly createSeriesUseCase: CreateSeriesUseCase,
    private readonly getSeriesByIdUseCase: GetSeriesByIdUseCase,
    private readonly updateSeriesImageUseCase: UpdateSeriesImageUseCase,
    private readonly updateSeriesUseCase: UpdateSeriesUseCase,
    private readonly getAllSeriesUseCase: GetAllSeriesUseCase,
    private readonly deleteSeriesUseCase: DeleteSeriesUseCase,
    private readonly searchSeriesUseCase: SearchSeriesUseCase,
    private readonly createSeriesCompleteUseCase: CreateSeriesCompleteUseCase,
    private readonly assignGenresUseCase: AssignGenresUseCase,
    private readonly removeGenresUseCase: RemoveGenresUseCase,
    private readonly addTitlesUseCase: AddTitlesUseCase,
    private readonly removeTitlesUseCase: RemoveTitlesUseCase,
    private readonly getGenresUseCase: GetGenresUseCase,
    private readonly getDemographicsUseCase: GetDemographicsUseCase
  ) {}

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
  getProductions = async (req: Request, res: Response) => {
    const validationResult = validateProduction(req.body);
    if (!validationResult.valid) return res.status(400).json(validationResult.errors);

    try {
      const resp = await this.getProductionsUseCase.execute(validationResult.result);
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
  getProductionYears = async (req: Request, res: Response) => {
    try {
      const resp = await this.getProductionYearsUseCase.execute();
      return res.status(200).json(resp);
    } catch (error) {
      console.error('Error in getProductionYears:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  };

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
  createSeries = async (req: Request, res: Response) => {
    try {
      const seriesData: SeriesCreateRequest = {
        name: req.body.name,
        chapter_number: parseInt(req.body.chapter_number),
        year: parseInt(req.body.year),
        description: req.body.description,
        qualification: parseFloat(req.body.qualification),
        demography_id: parseInt(req.body.demography_id),
        visible: req.body.visible === 'true',
      };

      const imageBuffer = req.file ? req.file.buffer : undefined;
      const result = await this.createSeriesUseCase.execute(seriesData, imageBuffer);

      if (result.error) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createSeries:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error',
      });
    }
  };

  /**
   * @swagger
   * /api/series/create-complete:
   *   post:
   *     summary: Crear serie completa con relaciones (JSON)
   *     tags: [Series]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
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
   *                 example: 2
   *               visible:
   *                 type: boolean
   *                 description: Si la serie es visible
   *                 example: true
   *               genres:
   *                 type: array
   *                 items:
   *                   type: number
   *                 description: Array de IDs de géneros
   *                 example: [1, 3, 5]
   *               titles:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array de títulos alternativos
   *                 example: ["Shingeki no Kyojin", "AOT"]
   *     responses:
   *       201:
   *         description: Serie creada exitosamente con relaciones
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
  createSeriesComplete = async (req: Request, res: Response) => {
    try {
      const seriesData: CreateSeriesCompleteRequest = req.body;

      const result = await this.createSeriesCompleteUseCase.execute(seriesData);

      return res.status(201).json({
        message: 'Serie creada exitosamente con relaciones',
        data: result,
      });
    } catch (error) {
      console.error('Error in createSeriesComplete:', error);
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
  getSeriesById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await this.getSeriesByIdUseCase.execute(id);

      if (result.error) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getSeriesById:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error',
      });
    }
  };

  /**
   * @swagger
   * /api/series/{id}/image:
   *   put:
   *     summary: Actualizar imagen de una serie
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
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *                 description: Nueva imagen de la serie
   *     responses:
   *       200:
   *         description: Imagen actualizada exitosamente
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
   *                   example: "Imagen actualizada exitosamente"
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
  updateSeriesImage = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (!req.file) {
        return res.status(400).json({
          error: true,
          message: 'No image provided',
        });
      }

      const result = await this.updateSeriesImageUseCase.execute(id, req.file.buffer);

      if (result.error) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in updateSeriesImage:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error',
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
  getAllSeries = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const series = await this.getAllSeriesUseCase.execute(limit, offset);
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
  updateSeries = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      // Procesar datos de multipart/form-data
      const seriesData: SeriesUpdateRequest = {
        id,
        name: req.body.name,
        chapter_number: req.body.chapter_number ? parseInt(req.body.chapter_number) : undefined,
        year: req.body.year ? parseInt(req.body.year) : undefined,
        description: req.body.description,
        qualification: req.body.qualification ? parseFloat(req.body.qualification) : undefined,
        demography_id: req.body.demography_id ? parseInt(req.body.demography_id) : undefined,
        visible:
          req.body.visible !== undefined ? req.body.visible === 'true' || req.body.visible === true : undefined,
      };

      // Actualizar datos de la serie
      const series = await this.updateSeriesUseCase.execute(id, seriesData);

      // Si se envió una imagen, procesarla y actualizar
      if (req.file) {
        const imageResult = await this.updateSeriesImageUseCase.execute(id, req.file.buffer);
        return res.status(200).json({
          message: 'Serie e imagen actualizadas exitosamente',
          data: imageResult,
        });
      }

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
  deleteSeries = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const deleted = await this.deleteSeriesUseCase.execute(id);
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
  searchSeries = async (req: Request, res: Response) => {
    try {
      const filters = req.body;
      const series = await this.searchSeriesUseCase.execute(filters);
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
   * /api/series/{id}/genres:
   *   post:
   *     summary: Asignar géneros a una serie
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
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - genres
   *             properties:
   *               genres:
   *                 type: array
   *                 items:
   *                   type: number
   *                 description: Array de IDs de géneros
   *                 example: [1, 3, 5]
   *     responses:
   *       200:
   *         description: Géneros asignados exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Géneros asignados exitosamente"
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
  assignGenres = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const { genres } = req.body;
      if (!Array.isArray(genres)) {
        return res.status(400).json({ error: 'Géneros debe ser un array' });
      }

      await this.assignGenresUseCase.execute(id, genres);

      return res.status(200).json({
        message: 'Géneros asignados exitosamente',
      });
    } catch (error) {
      console.error('Error in assignGenres:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * @swagger
   * /api/series/{id}/genres:
   *   delete:
   *     summary: Remover géneros de una serie
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
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - genres
   *             properties:
   *               genres:
   *                 type: array
   *                 items:
   *                   type: number
   *                 description: Array de IDs de géneros a remover
   *                 example: [1, 3]
   *     responses:
   *       200:
   *         description: Géneros removidos exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Géneros removidos exitosamente"
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
  removeGenres = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const { genres } = req.body;
      if (!Array.isArray(genres)) {
        return res.status(400).json({ error: 'Géneros debe ser un array' });
      }

      await this.removeGenresUseCase.execute(id, genres);

      return res.status(200).json({
        message: 'Géneros removidos exitosamente',
      });
    } catch (error) {
      console.error('Error in removeGenres:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * @swagger
   * /api/series/{id}/titles:
   *   post:
   *     summary: Agregar títulos alternativos a una serie
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
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - titles
   *             properties:
   *               titles:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array de títulos alternativos
   *                 example: ["Shingeki no Kyojin", "AOT"]
   *     responses:
   *       200:
   *         description: Títulos agregados exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Títulos agregados exitosamente"
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
  addTitles = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const { titles } = req.body;
      if (!Array.isArray(titles)) {
        return res.status(400).json({ error: 'Títulos debe ser un array' });
      }

      await this.addTitlesUseCase.execute(id, titles);

      return res.status(200).json({
        message: 'Títulos agregados exitosamente',
      });
    } catch (error) {
      console.error('Error in addTitles:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * @swagger
   * /api/series/{id}/titles:
   *   delete:
   *     summary: Remover títulos alternativos de una serie
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
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - titleIds
   *             properties:
   *               titleIds:
   *                 type: array
   *                 items:
   *                   type: number
   *                 description: Array de IDs de títulos a remover
   *                 example: [1, 2]
   *     responses:
   *       200:
   *         description: Títulos removidos exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Títulos removidos exitosamente"
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
  removeTitles = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const { titleIds } = req.body;
      if (!Array.isArray(titleIds)) {
        return res.status(400).json({ error: 'TitleIds debe ser un array' });
      }

      await this.removeTitlesUseCase.execute(id, titleIds);

      return res.status(200).json({
        message: 'Títulos removidos exitosamente',
      });
    } catch (error) {
      console.error('Error in removeTitles:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * @swagger
   * /api/series/genres:
   *   get:
   *     summary: Obtener lista de géneros disponibles
   *     tags: [Series]
   *     responses:
   *       200:
   *         description: Lista de géneros obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Géneros obtenidos exitosamente"
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: number
   *                         example: 1
   *                       name:
   *                         type: string
   *                         example: "Acción"
   *                       slug:
   *                         type: string
   *                         example: "accion"
   *       500:
   *         description: Error interno del servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  getGenres = async (req: Request, res: Response) => {
    try {
      const genres = await this.getGenresUseCase.execute();

      return res.status(200).json({
        message: 'Géneros obtenidos exitosamente',
        data: genres,
      });
    } catch (error) {
      console.error('Error in getGenres:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * @swagger
   * /api/series/demographics:
   *   get:
   *     summary: Obtener lista de demografías disponibles
   *     tags: [Series]
   *     responses:
   *       200:
   *         description: Lista de demografías obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Demografías obtenidas exitosamente"
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: number
   *                         example: 1
   *                       name:
   *                         type: string
   *                         example: "Shounen"
   *                       slug:
   *                         type: string
   *                         example: "shounen"
   *       500:
   *         description: Error interno del servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  getDemographics = async (req: Request, res: Response) => {
    try {
      const demographics = await this.getDemographicsUseCase.execute();

      return res.status(200).json({
        message: 'Demografías obtenidas exitosamente',
        data: demographics,
      });
    } catch (error) {
      console.error('Error in getDemographics:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  // Middleware para subida de imágenes
  uploadImageMiddleware = uploadMiddleware;
}
