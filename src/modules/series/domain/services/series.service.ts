import { ProductionRepository } from '../../infrastructure/repositories/series.repository';
import Production, { SeriesCreateRequest, SeriesUpdateRequest } from '../models/Series';
import ImageProcessor from '../../../../infrastructure/lib/image';
import path from 'path';

// Funciones currificadas eliminadas - usar SeriesServiceFactory en su lugar

// Servicios CRUD
export class SeriesService {
  private productionRepository: ProductionRepository;
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'series', 'img', 'tarjeta');

  constructor(productionRepository: ProductionRepository) {
    this.productionRepository = productionRepository;
  }

  async createSeries(seriesData: SeriesCreateRequest, imageBuffer?: Buffer): Promise<Production> {
    try {
      const newSeries = await this.productionRepository.create(seriesData);
      let imagePath: string | null = null;

      if (imageBuffer) {
        const optimizedImageBuffer = await ImageProcessor.optimizeImageAdvanced(imageBuffer);
        const filename = `${newSeries.id}.jpg`; // Usar el ID como nombre del archivo
        imagePath = await ImageProcessor.saveOptimizedImage(optimizedImageBuffer, filename, this.UPLOAD_DIR);
        await this.productionRepository.updateImage(newSeries.id, imagePath);
      }
      return { ...newSeries, image: imagePath || undefined };
    } catch (error) {
      throw new Error(`Error creating series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSeriesById(id: number): Promise<Production | null> {
    try {
      return await this.productionRepository.findById(id);
    } catch (error) {
      throw new Error(`Error getting series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllSeries(limit: number = 50, offset: number = 0): Promise<Production[]> {
    try {
      return await this.productionRepository.findAll(limit, offset);
    } catch (error) {
      throw new Error(`Error getting series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProductionYears(): Promise<any[]> {
    try {
      return await this.productionRepository.getProductionYears();
    } catch (error) {
      throw new Error(
        `Error getting production years: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getProductionsWithView(production: any): Promise<any[]> {
    try {
      return await this.productionRepository.getProduction(production);
    } catch (error) {
      throw new Error(`Error getting productions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateSeries(id: number, seriesData: SeriesUpdateRequest, imageBuffer?: Buffer): Promise<Production> {
    try {
      const existingSeries = await this.productionRepository.findById(id);
      if (!existingSeries) {
        throw new Error('Serie no encontrada');
      }

      let imagePath: string | undefined = undefined;

      if (imageBuffer) {
        // Delete old image if it exists
        if (existingSeries.image) {
          await ImageProcessor.deleteImage(path.join(this.UPLOAD_DIR, path.basename(existingSeries.image)));
        }
        const optimizedImageBuffer = await ImageProcessor.optimizeImageAdvanced(imageBuffer);
        const filename = `${id}.jpg`; // Usar el ID como nombre del archivo
        imagePath = await ImageProcessor.saveOptimizedImage(optimizedImageBuffer, filename, this.UPLOAD_DIR);
        // No need to set image in seriesData as it's handled separately
      }

      const updatedSeries = await this.productionRepository.update(id, seriesData);
      return { ...updatedSeries, image: imagePath || existingSeries.image };
    } catch (error) {
      throw new Error(`Error updating series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteSeries(id: number): Promise<boolean> {
    try {
      const existingSeries = await this.productionRepository.findById(id);
      if (!existingSeries) {
        return false;
      }

      if (existingSeries.image) {
        await ImageProcessor.deleteImage(path.join(this.UPLOAD_DIR, path.basename(existingSeries.image)));
      }
      return await this.productionRepository.delete(id);
    } catch (error) {
      throw new Error(`Error deleting series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchSeries(filters: Partial<Production>): Promise<Production[]> {
    try {
      return await this.productionRepository.search(filters);
    } catch (error) {
      throw new Error(`Error searching series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateSeriesImage(id: number, imageBuffer: Buffer): Promise<Production> {
    try {
      const existingSeries = await this.productionRepository.findById(id);
      if (!existingSeries) {
        throw new Error('Serie no encontrada');
      }

      if (existingSeries.image) {
        await ImageProcessor.deleteImage(path.join(this.UPLOAD_DIR, path.basename(existingSeries.image)));
      }

      const optimizedImageBuffer = await ImageProcessor.optimizeImageAdvanced(imageBuffer);
      const filename = `${id}.jpg`; // Usar el ID como nombre del archivo
      const imagePath = await ImageProcessor.saveOptimizedImage(optimizedImageBuffer, filename, this.UPLOAD_DIR);

      await this.productionRepository.updateImage(id, imagePath);
      const series = await this.productionRepository.findById(id);
      if (!series) {
        throw new Error('Serie no encontrada después de actualizar imagen');
      }
      return series;
    } catch (error) {
      throw new Error(`Error updating series image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Exportaciones eliminadas - usar SeriesServiceFactory en su lugar
