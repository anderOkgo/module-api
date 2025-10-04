import Movement, {
  CreateMovementRequest,
  UpdateMovementRequest,
  MovementResponse,
  MovementType,
  InitialLoadResponse,
} from '../../../../../src/modules/finan/domain/entities/movement.entity';

describe('Movement Entity', () => {
  describe('Movement interface', () => {
    it('should create a valid Movement object', () => {
      const movement: Movement = {
        id: 1,
        name: 'Test Movement',
        value: 100.5,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: 'test-tag',
        currency: 'USD',
        user: 'testuser',
        log: 0,
      };

      expect(movement.id).toBe(1);
      expect(movement.name).toBe('Test Movement');
      expect(movement.value).toBe(100.5);
      expect(movement.type_source_id).toBe(MovementType.INCOME);
      expect(movement.currency).toBe('USD');
      expect(movement.user).toBe('testuser');
    });

    it('should allow optional id and log fields', () => {
      const movement: Movement = {
        name: 'Test Movement',
        value: 100,
        date_movement: '2023-01-01',
        type_source_id: MovementType.EXPENSE,
        tag: 'test-tag',
        currency: 'EUR',
        user: 'testuser',
      };

      expect(movement.id).toBeUndefined();
      expect(movement.log).toBeUndefined();
      expect(movement.name).toBe('Test Movement');
    });
  });

  describe('CreateMovementRequest interface', () => {
    it('should create a valid CreateMovementRequest', () => {
      const request: CreateMovementRequest = {
        movement_name: 'New Movement',
        movement_val: 250.75,
        movement_date: '2023-12-01',
        movement_type: MovementType.TRANSFER,
        movement_tag: 'transfer-tag',
        currency: 'GBP',
        username: 'testuser',
        operate_for: 123,
      };

      expect(request.movement_name).toBe('New Movement');
      expect(request.movement_val).toBe(250.75);
      expect(request.movement_type).toBe(MovementType.TRANSFER);
      expect(request.operate_for).toBe(123);
    });

    it('should allow optional operate_for field', () => {
      const request: CreateMovementRequest = {
        movement_name: 'Simple Movement',
        movement_val: 50,
        movement_date: '2023-12-01',
        movement_type: MovementType.INCOME,
        movement_tag: 'income-tag',
        currency: 'USD',
        username: 'testuser',
      };

      expect(request.operate_for).toBeUndefined();
      expect(request.movement_name).toBe('Simple Movement');
    });
  });

  describe('UpdateMovementRequest interface', () => {
    it('should create a valid UpdateMovementRequest', () => {
      const request: UpdateMovementRequest = {
        movement_name: 'Updated Movement',
        movement_val: 300,
        movement_date: '2023-12-15',
        movement_type: MovementType.EXPENSE,
        movement_tag: 'updated-tag',
        currency: 'CAD',
        operate_for: 456,
      };

      expect(request.movement_name).toBe('Updated Movement');
      expect(request.movement_val).toBe(300);
      expect(request.movement_type).toBe(MovementType.EXPENSE);
      expect(request.operate_for).toBe(456);
    });

    it('should allow optional operate_for field', () => {
      const request: UpdateMovementRequest = {
        movement_name: 'Simple Update',
        movement_val: 75,
        movement_date: '2023-12-15',
        movement_type: MovementType.INCOME,
        movement_tag: 'simple-tag',
        currency: 'USD',
      };

      expect(request.operate_for).toBeUndefined();
      expect(request.movement_name).toBe('Simple Update');
    });
  });

  describe('MovementResponse interface', () => {
    it('should create a valid MovementResponse', () => {
      const response: MovementResponse = {
        id: 1,
        name: 'Response Movement',
        value: 150.25,
        date_movement: '2023-06-15',
        type_source_id: MovementType.INCOME,
        tag: 'response-tag',
        currency: 'USD',
        user: 'responseuser',
      };

      expect(response.id).toBe(1);
      expect(response.name).toBe('Response Movement');
      expect(response.value).toBe(150.25);
      expect(response.type_source_id).toBe(MovementType.INCOME);
      expect(response.user).toBe('responseuser');
    });
  });

  describe('MovementType enum', () => {
    it('should have correct enum values', () => {
      expect(MovementType.INCOME).toBe(1);
      expect(MovementType.EXPENSE).toBe(2);
      expect(MovementType.TRANSFER).toBe(8);
    });

    it('should be usable in movement objects', () => {
      const incomeMovement: Movement = {
        name: 'Salary',
        value: 5000,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: 'salary',
        currency: 'USD',
        user: 'employee',
      };

      const expenseMovement: Movement = {
        name: 'Rent',
        value: 1200,
        date_movement: '2023-01-01',
        type_source_id: MovementType.EXPENSE,
        tag: 'rent',
        currency: 'USD',
        user: 'tenant',
      };

      const transferMovement: Movement = {
        name: 'Transfer to Savings',
        value: 500,
        date_movement: '2023-01-01',
        type_source_id: MovementType.TRANSFER,
        tag: 'savings',
        currency: 'USD',
        user: 'saver',
      };

      expect(incomeMovement.type_source_id).toBe(MovementType.INCOME);
      expect(expenseMovement.type_source_id).toBe(MovementType.EXPENSE);
      expect(transferMovement.type_source_id).toBe(MovementType.TRANSFER);
    });
  });

  describe('InitialLoadResponse interface', () => {
    it('should create a valid InitialLoadResponse with required fields', () => {
      const response: InitialLoadResponse = {
        totalExpenseDay: [],
        movements: [],
        movementTag: [],
        totalBalance: [],
        yearlyBalance: [],
        monthlyBalance: [],
        balanceUntilDate: [],
        monthlyExpensesUntilDay: [],
      };

      expect(response.totalExpenseDay).toEqual([]);
      expect(response.movements).toEqual([]);
      expect(response.movementTag).toEqual([]);
      expect(response.totalBalance).toEqual([]);
      expect(response.yearlyBalance).toEqual([]);
      expect(response.monthlyBalance).toEqual([]);
      expect(response.balanceUntilDate).toEqual([]);
      expect(response.monthlyExpensesUntilDay).toEqual([]);
    });

    it('should allow optional generalInfo and tripInfo fields', () => {
      const response: InitialLoadResponse = {
        totalExpenseDay: [],
        movements: [],
        movementTag: [],
        totalBalance: [],
        yearlyBalance: [],
        monthlyBalance: [],
        balanceUntilDate: [],
        monthlyExpensesUntilDay: [],
        generalInfo: [{ id: 1, info: 'general' }],
        tripInfo: [{ id: 1, trip: 'vacation' }],
      };

      expect(response.generalInfo).toEqual([{ id: 1, info: 'general' }]);
      expect(response.tripInfo).toEqual([{ id: 1, trip: 'vacation' }]);
    });

    it('should handle undefined optional fields', () => {
      const response: InitialLoadResponse = {
        totalExpenseDay: [],
        movements: [],
        movementTag: [],
        totalBalance: [],
        yearlyBalance: [],
        monthlyBalance: [],
        balanceUntilDate: [],
        monthlyExpensesUntilDay: [],
      };

      expect(response.generalInfo).toBeUndefined();
      expect(response.tripInfo).toBeUndefined();
    });
  });

  describe('Edge cases and boundary values', () => {
    it('should handle zero values', () => {
      const movement: Movement = {
        name: 'Zero Movement',
        value: 0,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: 'zero-tag',
        currency: 'USD',
        user: 'testuser',
      };

      expect(movement.value).toBe(0);
    });

    it('should handle negative values', () => {
      const movement: Movement = {
        name: 'Negative Movement',
        value: -100,
        date_movement: '2023-01-01',
        type_source_id: MovementType.EXPENSE,
        tag: 'negative-tag',
        currency: 'USD',
        user: 'testuser',
      };

      expect(movement.value).toBe(-100);
    });

    it('should handle empty strings', () => {
      const movement: Movement = {
        name: '',
        value: 100,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: '',
        currency: '',
        user: '',
      };

      expect(movement.name).toBe('');
      expect(movement.tag).toBe('');
      expect(movement.currency).toBe('');
      expect(movement.user).toBe('');
    });

    it('should handle large numbers', () => {
      const movement: Movement = {
        name: 'Large Movement',
        value: 999999999.99,
        date_movement: '2023-01-01',
        type_source_id: MovementType.INCOME,
        tag: 'large-tag',
        currency: 'USD',
        user: 'testuser',
      };

      expect(movement.value).toBe(999999999.99);
    });
  });
});
