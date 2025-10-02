import { Request, Response } from 'express';
// Commands
import { CreateSeriesCommand } from '../../application/commands/create-series.command';
import { UpdateSeriesCommand } from '../../application/commands/update-series.command';
import { DeleteSeriesCommand } from '../../application/commands/delete-series.command';
import { CreateSeriesCompleteCommand } from '../../application/commands/create-series-complete.command';
import { UpdateSeriesImageCommand } from '../../application/commands/update-series-image.command';
import { AssignGenresCommand } from '../../application/commands/assign-genres.command';
import { RemoveGenresCommand } from '../../application/commands/remove-genres.command';
import { AddTitlesCommand } from '../../application/commands/add-titles.command';
import { RemoveTitlesCommand } from '../../application/commands/remove-titles.command';
// Queries
import { GetSeriesByIdQuery } from '../../application/queries/get-series-by-id.query';
import { SearchSeriesQuery } from '../../application/queries/search-series.query';
import { GetAllSeriesQuery } from '../../application/queries/get-all-series.query';
import { GetProductionsQuery } from '../../application/queries/get-productions.query';
import { GetGenresQuery } from '../../application/queries/get-genres.query';
import { GetDemographicsQuery } from '../../application/queries/get-demographics.query';
import { GetProductionYearsQuery } from '../../application/queries/get-production-years.query';
// Handlers
import { CreateSeriesHandler } from '../../application/handlers/commands/create-series.handler';
import { UpdateSeriesHandler } from '../../application/handlers/commands/update-series.handler';
import { DeleteSeriesHandler } from '../../application/handlers/commands/delete-series.handler';
import { AssignGenresHandler } from '../../application/handlers/commands/assign-genres.handler';
import { RemoveGenresHandler } from '../../application/handlers/commands/remove-genres.handler';
import { AddTitlesHandler } from '../../application/handlers/commands/add-titles.handler';
import { RemoveTitlesHandler } from '../../application/handlers/commands/remove-titles.handler';
import { CreateSeriesCompleteHandler } from '../../application/handlers/commands/create-series-complete.handler';
import { UpdateSeriesImageHandler } from '../../application/handlers/commands/update-series-image.handler';
import { GetSeriesByIdHandler } from '../../application/handlers/queries/get-series-by-id.handler';
import { SearchSeriesHandler } from '../../application/handlers/queries/search-series.handler';
import { GetAllSeriesHandler } from '../../application/handlers/queries/get-all-series.handler';
import { GetGenresHandler } from '../../application/handlers/queries/get-genres.handler';
import { GetDemographicsHandler } from '../../application/handlers/queries/get-demographics.handler';
import { GetProductionYearsHandler } from '../../application/handlers/queries/get-production-years.handler';
import { GetProductionsHandler } from '../../application/handlers/queries/get-productions.handler';
// Utils
import { uploadMiddleware } from '../../../../infrastructure/services/upload';
import { validateProduction } from '../validation/series.validation';

/**
 * SeriesController con CQRS Pattern
 * Separación clara entre Commands (Write) y Queries (Read)
 * Completamente migrado a CQRS
 */
export class SeriesController {
  // Middleware para upload de imágenes
  public uploadImageMiddleware = uploadMiddleware;

  constructor(
    // Command Handlers (Escritura) - CQRS
    private readonly createSeriesHandler: CreateSeriesHandler,
    private readonly updateSeriesHandler: UpdateSeriesHandler,
    private readonly deleteSeriesHandler: DeleteSeriesHandler,
    private readonly assignGenresHandler: AssignGenresHandler,
    private readonly removeGenresHandler: RemoveGenresHandler,
    private readonly addTitlesHandler: AddTitlesHandler,
    private readonly removeTitlesHandler: RemoveTitlesHandler,
    private readonly createSeriesCompleteHandler: CreateSeriesCompleteHandler,
    private readonly updateSeriesImageHandler: UpdateSeriesImageHandler,
    // Query Handlers (Lectura) - CQRS
    private readonly getSeriesByIdHandler: GetSeriesByIdHandler,
    private readonly searchSeriesHandler: SearchSeriesHandler,
    private readonly getAllSeriesHandler: GetAllSeriesHandler,
    private readonly getGenresHandler: GetGenresHandler,
    private readonly getDemographicsHandler: GetDemographicsHandler,
    private readonly getProductionYearsHandler: GetProductionYearsHandler,
    private readonly getProductionsHandler: GetProductionsHandler
  ) {}

  /**
   * Command: Crear una nueva serie
   * POST /api/series/create
   */
  createSeries = async (req: Request, res: Response) => {
    try {
      const command = new CreateSeriesCommand(
        req.body.name,
        parseInt(req.body.chapter_number),
        parseInt(req.body.year),
        req.body.description,
        parseFloat(req.body.qualification),
        parseInt(req.body.demography_id),
        req.body.visible === 'true',
        req.file?.buffer
      );

      const result = await this.createSeriesHandler.execute(command);

      res.status(201).json({
        success: true,
        message: 'Series created successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in createSeries:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error creating series',
      });
    }
  };

  /**
   * Command: Actualizar una serie
   * PUT /api/series/:id
   */
  updateSeries = async (req: Request, res: Response) => {
    try {
      const command = new UpdateSeriesCommand(
        parseInt(req.params.id),
        req.body.name,
        req.body.chapter_number ? parseInt(req.body.chapter_number) : undefined,
        req.body.year ? parseInt(req.body.year) : undefined,
        req.body.description,
        req.body.qualification ? parseFloat(req.body.qualification) : undefined,
        req.body.demography_id ? parseInt(req.body.demography_id) : undefined,
        req.body.visible !== undefined ? req.body.visible === 'true' : undefined
      );

      const result = await this.updateSeriesHandler.execute(command);

      res.status(200).json({
        success: true,
        message: 'Series updated successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in updateSeries:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error updating series',
      });
    }
  };

  /**
   * Command: Eliminar una serie
   * DELETE /api/series/:id
   */
  deleteSeries = async (req: Request, res: Response) => {
    try {
      const command = new DeleteSeriesCommand(parseInt(req.params.id));
      const result = await this.deleteSeriesHandler.execute(command);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error in deleteSeries:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error deleting series',
      });
    }
  };

  /**
   * Query: Obtener serie por ID
   * GET /api/series/:id
   */
  getSeriesById = async (req: Request, res: Response) => {
    try {
      const query = new GetSeriesByIdQuery(parseInt(req.params.id));
      const result = await this.getSeriesByIdHandler.execute(query);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Series not found',
        });
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error in getSeriesById:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error fetching series',
      });
    }
  };

  /**
   * Query: Buscar series con filtros
   * POST /api/series/search
   */
  searchSeries = async (req: Request, res: Response) => {
    try {
      const query = new SearchSeriesQuery(req.body);
      const result = await this.searchSeriesHandler.execute(query);

      res.status(200).json({
        success: true,
        data: result,
        count: result.length,
      });
    } catch (error) {
      console.error('Error in searchSeries:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error searching series',
      });
    }
  };

  /**
   * Query: Listar todas las series con paginación
   * GET /api/series/list?limit=50&offset=0
   */
  getAllSeries = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const query = new GetAllSeriesQuery(limit, offset);
      const result = await this.getAllSeriesHandler.execute(query);

      res.status(200).json({
        success: true,
        data: result.series,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error in getAllSeries:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error fetching series list',
      });
    }
  };

  /**
   * Query: Obtener producciones con filtros (boot endpoint)
   * POST /api/series/
   */
  getProductions = async (req: Request, res: Response) => {
    const validationResult = validateProduction(req.body);
    if (!validationResult.valid) return res.status(400).json(validationResult.errors);

    try {
      const query = new GetProductionsQuery(validationResult.result);
      const result = await this.getProductionsHandler.execute(query);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getProductions:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  };

  /**
   * Query: Obtener años de producción disponibles
   * GET /api/series/years
   */
  getProductionYears = async (req: Request, res: Response) => {
    try {
      const query = new GetProductionYearsQuery();
      const result = await this.getProductionYearsHandler.execute(query);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getProductionYears:', error);
      return res.status(500).json({
        error: true,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  };

  /**
   * Command: Crear serie completa con relaciones
   * POST /api/series/create-complete
   */
  createSeriesComplete = async (req: Request, res: Response) => {
    try {
      const command = new CreateSeriesCompleteCommand(req.body);
      const result = await this.createSeriesCompleteHandler.execute(command);

      return res.status(201).json({
        success: result.success,
        message: result.message,
        id: result.id,
      });
    } catch (error) {
      console.error('Error in createSeriesComplete:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * Command: Actualizar imagen de una serie
   * PUT /api/series/:id/image
   */
  updateSeriesImage = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID inválido' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No se envió ninguna imagen' });
      }

      const command = new UpdateSeriesImageCommand(id, req.file);
      const result = await this.updateSeriesImageHandler.execute(command);

      return res.status(200).json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      console.error('Error in updateSeriesImage:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * Command: Asignar géneros a una serie
   * POST /api/series/:id/genres
   */
  assignGenres = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const genreIds: number[] = req.body.genreIds || req.body.genre_ids || req.body.genres || [];

      const command = new AssignGenresCommand(id, genreIds);

      const result = await this.assignGenresHandler.execute(command);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in assignGenres:', error);
      return res.status(400).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * Command: Remover géneros de una serie
   * DELETE /api/series/:id/genres
   */
  removeGenres = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const genreIds: number[] = req.body.genreIds || req.body.genre_ids || req.body.genres || [];

      const command = new RemoveGenresCommand(id, genreIds);

      const result = await this.removeGenresHandler.execute(command);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in removeGenres:', error);
      return res.status(400).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * Command: Agregar títulos alternativos a una serie
   * POST /api/series/:id/titles
   */
  addTitles = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const titles: string[] = req.body.titles || [];

      const command = new AddTitlesCommand(id, titles);

      const result = await this.addTitlesHandler.execute(command);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in addTitles:', error);
      return res.status(400).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * Command: Remover títulos alternativos de una serie
   * DELETE /api/series/:id/titles
   */
  removeTitles = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const titleIds: number[] = req.body.titleIds || req.body.title_ids || req.body.titles || [];

      const command = new RemoveTitlesCommand(id, titleIds);

      const result = await this.removeTitlesHandler.execute(command);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in removeTitles:', error);
      return res.status(400).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * Query: Obtener lista de géneros disponibles
   * GET /api/series/genres
   */
  getGenres = async (req: Request, res: Response) => {
    try {
      const query = new GetGenresQuery();
      const result = await this.getGenresHandler.execute(query);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getGenres:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * Query: Obtener lista de demografías disponibles
   * GET /api/series/demographics
   */
  getDemographics = async (req: Request, res: Response) => {
    try {
      const query = new GetDemographicsQuery();
      const result = await this.getDemographicsHandler.execute(query);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getDemographics:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };
}
