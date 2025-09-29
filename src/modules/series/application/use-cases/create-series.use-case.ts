import { SeriesCreateRequest } from '../../domain/entities/series.entity';
import { ProductionRepository } from '../ports/series.repository';
import { ProductionMysqlRepository } from '../../infrastructure/persistence/series.mysql';
import { ImageProcessor } from '../../../../infrastructure/lib/image';
import path from 'path';

export class CreateSeriesUseCase {
  private repository: ProductionRepository;
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'series', 'img', 'tarjeta');

  constructor(repository?: ProductionRepository) {
    // Usar el repositorio inyectado o crear uno por defecto
    this.repository = repository || new ProductionMysqlRepository();
  }

  async execute(seriesData: SeriesCreateRequest, imageBuffer?: Buffer): Promise<any> {
    try {
      const newSeries = await this.repository.create(seriesData);
      let imagePath: string | null = null;

      if (imageBuffer) {
        const optimizedImageBuffer = await ImageProcessor.optimizeImage(imageBuffer);
        const filename = `${newSeries.id}.jpg`; // Usar el ID como nombre del archivo
        await ImageProcessor.saveOptimizedImage(optimizedImageBuffer, filename, this.UPLOAD_DIR);
        // Guardar solo la ruta web relativa en la base de datos
        imagePath = `/img/tarjeta/${filename}`;
        await this.repository.updateImage(newSeries.id, imagePath);
      }
      return { ...newSeries, image: imagePath || undefined };
    } catch (error) {
      throw new Error(`Error creating series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
