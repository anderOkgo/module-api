import { SeriesService } from './series.service';
import { ProductionRepository } from '../../infrastructure/repositories/series.repository';
import { ProductionMysqlRepository } from '../../infrastructure/series.mysql';

// Factory pattern para crear servicios de series
export class SeriesServiceFactory {
  private static seriesService: SeriesService | null = null;

  // Método principal para obtener el servicio
  static getSeriesService(): SeriesService {
    if (!this.seriesService) {
      const productionRepository: ProductionRepository = new ProductionMysqlRepository();
      this.seriesService = new SeriesService(productionRepository);
    }
    return this.seriesService;
  }

  // Método para testing - permite inyectar dependencias mock
  static createSeriesService(productionRepository: ProductionRepository): SeriesService {
    return new SeriesService(productionRepository);
  }

  // Método para resetear (útil en testing)
  static reset(): void {
    this.seriesService = null;
  }
}

// Exportar función helper para uso directo
export const getSeriesService = () => SeriesServiceFactory.getSeriesService();
export default SeriesServiceFactory;
