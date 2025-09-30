import { ProductionRepository } from '../ports/series.repository';
import { SeriesCreateRequest } from '../../domain/entities/series.entity';

export interface CreateSeriesCompleteRequest {
  name: string;
  chapter_number: number;
  year: number;
  description: string;
  qualification: number;
  demography_id: number;
  visible: boolean;
  genres?: number[]; // Array de IDs de géneros
  titles?: string[]; // Array de títulos alternativos
}

export class CreateSeriesCompleteUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(seriesData: CreateSeriesCompleteRequest): Promise<any> {
    try {
      // 1. Crear la serie básica
      const basicSeriesData: SeriesCreateRequest = {
        name: seriesData.name,
        chapter_number: seriesData.chapter_number,
        year: seriesData.year,
        description: seriesData.description,
        qualification: seriesData.qualification,
        demography_id: seriesData.demography_id,
        visible: seriesData.visible,
      };

      const newSeries = await this.repository.create(basicSeriesData);

      // 2. Asignar géneros si se proporcionan
      if (seriesData.genres && seriesData.genres.length > 0) {
        await this.repository.assignGenres(newSeries.id, seriesData.genres);
      }

      // 3. Agregar títulos alternativos si se proporcionan
      if (seriesData.titles && seriesData.titles.length > 0) {
        await this.repository.addTitles(newSeries.id, seriesData.titles);
      }

      // 4. Obtener la serie completa con relaciones
      const completeSeries = await this.repository.findById(newSeries.id);
      return completeSeries;
    } catch (error) {
      throw new Error(
        `Error creating complete series: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
