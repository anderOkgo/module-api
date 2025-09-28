// Ejemplo de cómo usar el factory pattern para testing en Series
import { SeriesServiceFactory } from './series.factory';
import { SeriesService } from './series.service';
import { ProductionRepository } from '../../infrastructure/repositories/series.repository';

// Mock del repository para testing
class MockProductionRepository implements ProductionRepository {
  async create(seriesData: any): Promise<any> {
    return { id: 1, ...seriesData };
  }

  async getProduction(production: any): Promise<any> {
    return [{ id: 1, name: 'Test Series' }];
  }

  async getProductionYears(): Promise<any> {
    return [2020, 2021, 2022];
  }

  // ... implementar otros métodos necesarios
  async findById(id: number): Promise<any> {
    return { id, name: 'Test' };
  }
  async update(id: number, data: any): Promise<any> {
    return { id, ...data };
  }
  async delete(id: number): Promise<boolean> {
    return true;
  }
  async updateImage(id: number, imagePath: string): Promise<boolean> {
    return true;
  }
  async searchSeries(query: string): Promise<any> {
    return [];
  }
  async findAll(limit: number, offset: number): Promise<any> {
    return [{ id: 1, name: 'Test Series' }];
  }
  async search(filters: any): Promise<any> {
    return [];
  }
}

// Ejemplo de test
describe('SeriesService', () => {
  beforeEach(() => {
    // Resetear el factory antes de cada test
    SeriesServiceFactory.reset();
  });

  it('should get productions with mock repository', async () => {
    // Crear servicio con mock repository
    const mockRepo = new MockProductionRepository();
    const seriesService = SeriesServiceFactory.createSeriesService(mockRepo);

    // Test del servicio
    const result = await seriesService.getAllSeries(10, 0);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
