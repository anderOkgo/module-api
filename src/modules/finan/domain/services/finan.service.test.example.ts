// Ejemplo de cómo usar el factory pattern para testing en Finan
import { FinanServiceFactory } from './finan.factory';
import { FinanService } from './finan.service';
import { FinanRepository } from '../../infrastructure/repositories/finan.repository';

// Mock del repository para testing
class MockFinanRepository implements FinanRepository {
  async getInitialLoad(data: any): Promise<any> {
    return {
      totalExpenseDay: { total: 100 },
      movements: [],
      movementTag: [],
      totalBalance: { balance: 1000 },
      yearlyBalance: { year: 2023, balance: 1000 },
      monthlyBalance: { month: '2023-12', balance: 100 },
      balanceUntilDate: { balance: 1000 },
      monthlyExpensesUntilDay: { expenses: 50 },
    };
  }

  async putMovement(movement: any): Promise<any> {
    return { id: 1, ...movement };
  }

  async updateMovementById(id: number, movement: any): Promise<any> {
    return { id, ...movement };
  }

  async deleteMovementById(id: number, username: string): Promise<boolean> {
    return true;
  }
}

// Ejemplo de test
describe('FinanService', () => {
  beforeEach(() => {
    // Resetear el factory antes de cada test
    FinanServiceFactory.reset();
  });

  it('should get initial load with mock repository', async () => {
    // Crear servicio con mock repository
    const mockRepo = new MockFinanRepository();
    const finanService = FinanServiceFactory.createFinanService(mockRepo);

    // Test del servicio
    const result = await finanService.getInitialLoad({ currency: 'AUD' });

    expect(result).toBeDefined();
    expect(result.totalExpenseDay).toBeDefined();
  });
});
