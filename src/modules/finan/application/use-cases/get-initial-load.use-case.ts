import { FinanRepository } from '../ports/finan.repository';
import { InitialLoadRequest } from '../../domain/entities/movement-request.entity';
import { InitialLoadResponse } from '../../domain/entities/movement.entity';

/**
 * Use case for obtaining initial load of financial data
 * Orchestrates the retrieval of multiple types of financial data
 */
export class GetInitialLoadUseCase {
  constructor(private readonly repository: FinanRepository) {}

  async execute(data: InitialLoadRequest): Promise<InitialLoadResponse> {
    try {
      // 1. Validate input
      this.validateInput(data);

      // 2. Normalize data
      const username = data.username?.toLowerCase().trim() ?? '';
      const currency = data.currency ?? 'USD';
      const date = data.date ?? data.start_date ?? this.getCurrentDate();

      this.repository.createTableForUser(username);

      // 3. Get data in parallel for better performance
      const [
        totalExpenseDay,
        movements,
        movementTag,
        totalBalance,
        yearlyBalance,
        monthlyBalance,
        balanceUntilDate,
        monthlyExpensesUntilDay,
        monthlyBudget,
        currentMonthExpenses,
      ] = await Promise.all([
        this.repository.getTotalExpenseDay(username, currency, date),
        this.repository.getMovements(username, currency),
        this.repository.getMovementsByTag(username, currency),
        this.repository.getTotalBalance(username, currency),
        this.repository.getYearlyBalance(username, currency),
        this.repository.getMonthlyBalance(username, currency),
        this.repository.getBalanceUntilDate(username, currency),
        this.repository.getMonthlyExpensesUntilCurrentDay(username, currency),
        this.repository.getMonthlyBudget(username, currency),
        this.repository.getCurrentMonthExpenses(username, currency),
      ]);

      // 4. Build base response
      const response: InitialLoadResponse = {
        totalExpenseDay,
        movements,
        movementTag,
        totalBalance,
        yearlyBalance,
        monthlyBalance,
        balanceUntilDate,
        monthlyExpensesUntilDay,
        monthlyBudget,
        currentMonthExpenses,
        remainingBudget: (monthlyBudget ?? 0) - (currentMonthExpenses ?? 0),
      };

      // 5. Add additional information for specific users
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
    // Business logic: users with access to extended information
    const privilegedUsers = ['anderokgo'];
    return privilegedUsers.includes(username.toLowerCase());
  }
}
