import { FinanRepository } from '../ports/finan.repository';
import { InitialLoadRequest } from '../../domain/entities/movement-request.entity';
import { InitialLoadResponse } from '../../domain/entities/movement.entity';

/**
 * Caso de uso para obtener la carga inicial de datos financieros
 * Orquesta la obtención de múltiples tipos de datos financieros
 */
export class GetInitialLoadUseCase {
  constructor(private readonly repository: FinanRepository) {}

  async execute(data: InitialLoadRequest): Promise<InitialLoadResponse> {
    try {
      // 1. Validar entrada
      this.validateInput(data);

      // 2. Normalizar datos
      const username = data.username?.toLowerCase() ?? '';
      const currency = data.currency ?? 'USD';
      const date = data.date ?? data.start_date ?? this.getCurrentDate();

      // 3. Obtener datos en paralelo para mejor performance
      const [
        totalExpenseDay,
        movements,
        movementTag,
        totalBalance,
        yearlyBalance,
        monthlyBalance,
        balanceUntilDate,
        monthlyExpensesUntilDay,
      ] = await Promise.all([
        this.repository.getTotalExpenseDay(username, currency, date),
        this.repository.getMovements(username, currency),
        this.repository.getMovementsByTag(username, currency),
        this.repository.getTotalBalance(username, currency),
        this.repository.getYearlyBalance(username, currency),
        this.repository.getMonthlyBalance(username, currency),
        this.repository.getBalanceUntilDate(username, currency),
        this.repository.getMonthlyExpensesUntilCurrentDay(username, currency),
      ]);

      // 4. Construir respuesta base
      const response: InitialLoadResponse = {
        totalExpenseDay,
        movements,
        movementTag,
        totalBalance,
        yearlyBalance,
        monthlyBalance,
        balanceUntilDate,
        monthlyExpensesUntilDay,
      };

      // 5. Agregar información adicional para usuarios específicos
      if (this.isPrivilegedUser(username)) {
        const [generalInfo, tripInfo] = await Promise.all([
          this.repository.getGeneralInfo(),
          this.repository.getTripInfo(),
        ]);
        response.generalInfo = generalInfo;
        response.tripInfo = tripInfo;
      }

      return response;
    } catch (error) {
      console.error('Error in GetInitialLoadUseCase:', error);
      throw new Error(`Failed to load initial data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateInput(data: InitialLoadRequest): void {
    if (!data.username) {
      throw new Error('Username is required');
    }

    if (data.username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private isPrivilegedUser(username: string): boolean {
    // Lógica de negocio: usuarios con acceso a información extendida
    const privilegedUsers = ['anderokgo'];
    return privilegedUsers.includes(username.toLowerCase());
  }
}
