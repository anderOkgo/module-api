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
import { SeriesCreateRequest, SeriesUpdateRequest } from '../../domain/entities/series.entity';

/**
 * SeriesController con inyección de dependencias
 * Sigue el patrón hexagonal/clean architecture
 * Documentación Swagger: series.swagger.ts
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
   * Obtener producciones con filtros (Boot endpoint)
   * Documentación Swagger: series.swagger.ts
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
   * Obtener todos los años de producción disponibles
   * Documentación Swagger: series.swagger.ts
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
   * Crear una nueva serie (multipart/form-data)
   * Documentación Swagger: series.swagger.ts
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
   * Crear serie completa con relaciones (JSON)
   * Documentación Swagger: series.swagger.ts
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
   * Obtener serie por ID
   * Documentación Swagger: series.swagger.ts
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
   * Actualizar imagen de una serie
   * Documentación Swagger: series.swagger.ts
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
   * Obtener todas las series
   * Documentación Swagger: series.swagger.ts
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
   * Actualizar serie existente
   * Documentación Swagger: series.swagger.ts
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
   * Eliminar serie
   * Documentación Swagger: series.swagger.ts
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
   * Buscar series con filtros
   * Documentación Swagger: series.swagger.ts
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
   * Asignar géneros a una serie
   * Documentación Swagger: series.swagger.ts
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
   * Remover géneros de una serie
   * Documentación Swagger: series.swagger.ts
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
   * Agregar títulos alternativos a una serie
   * Documentación Swagger: series.swagger.ts
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
   * Remover títulos alternativos de una serie
   * Documentación Swagger: series.swagger.ts
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
   * Obtener lista de géneros disponibles
   * Documentación Swagger: series.swagger.ts
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
   * Obtener lista de demografías disponibles
   * Documentación Swagger: series.swagger.ts
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
