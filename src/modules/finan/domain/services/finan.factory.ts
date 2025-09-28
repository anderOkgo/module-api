import { FinanService } from './finan.service';
import { FinanRepository } from '../../infrastructure/repositories/finan.repository';
import { FinanMysqlRepository } from '../../infrastructure/finan.mysql';

// Factory pattern para crear servicios financieros
export class FinanServiceFactory {
  private static finanService: FinanService | null = null;

  // Método principal para obtener el servicio
  static getFinanService(): FinanService {
    if (!this.finanService) {
      const finanRepository: FinanRepository = new FinanMysqlRepository();
      this.finanService = new FinanService(finanRepository);
    }
    return this.finanService;
  }

  // Método para testing - permite inyectar dependencias mock
  static createFinanService(finanRepository: FinanRepository): FinanService {
    return new FinanService(finanRepository);
  }

  // Método para resetear (útil en testing)
  static reset(): void {
    this.finanService = null;
  }
}

// Exportar función helper para uso directo
export const getFinanService = () => FinanServiceFactory.getFinanService();
export default FinanServiceFactory;
