import {
  InitialLoadRequest,
  MovementRequest,
  MovementUpdateRequest,
} from '../../../../../src/modules/finan/domain/entities/movement-request.entity';

describe('Movement Request Entities', () => {
  describe('InitialLoadRequest interface', () => {
    it('should create a valid InitialLoadRequest with all fields', () => {
      const request: InitialLoadRequest = {
        username: 'testuser',
        currency: 'USD',
        date: '2023-01-01',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
      };

      expect(request.username).toBe('testuser');
      expect(request.currency).toBe('USD');
      expect(request.date).toBe('2023-01-01');
      expect(request.start_date).toBe('2023-01-01');
      expect(request.end_date).toBe('2023-12-31');
    });

    it('should allow all fields to be optional', () => {
      const request: InitialLoadRequest = {};

      expect(request.username).toBeUndefined();
      expect(request.currency).toBeUndefined();
      expect(request.date).toBeUndefined();
      expect(request.start_date).toBeUndefined();
      expect(request.end_date).toBeUndefined();
    });

    it('should allow partial fields', () => {
      const request: InitialLoadRequest = {
        username: 'testuser',
        currency: 'EUR',
      };

      expect(request.username).toBe('testuser');
      expect(request.currency).toBe('EUR');
      expect(request.date).toBeUndefined();
      expect(request.start_date).toBeUndefined();
      expect(request.end_date).toBeUndefined();
    });

    it('should handle date range fields', () => {
      const request: InitialLoadRequest = {
        start_date: '2023-01-01',
        end_date: '2023-01-31',
      };

      expect(request.start_date).toBe('2023-01-01');
      expect(request.end_date).toBe('2023-01-31');
    });
  });

  describe('MovementRequest interface', () => {
    it('should create a valid MovementRequest', () => {
      const request: MovementRequest = {
        movement_name: 'Test Movement',
        movement_val: 100.5,
        movement_date: '2023-01-01',
        movement_type: '1',
        movement_tag: 'test-tag',
        currency: 'USD',
      };

      expect(request.movement_name).toBe('Test Movement');
      expect(request.movement_val).toBe(100.5);
      expect(request.movement_date).toBe('2023-01-01');
      expect(request.movement_type).toBe('1');
      expect(request.movement_tag).toBe('test-tag');
      expect(request.currency).toBe('USD');
    });

    it('should handle different movement types as strings', () => {
      const incomeRequest: MovementRequest = {
        movement_name: 'Salary',
        movement_val: 5000,
        movement_date: '2023-01-01',
        movement_type: '1',
        movement_tag: 'salary',
        currency: 'USD',
      };

      const expenseRequest: MovementRequest = {
        movement_name: 'Rent',
        movement_val: 1200,
        movement_date: '2023-01-01',
        movement_type: '2',
        movement_tag: 'rent',
        currency: 'USD',
      };

      const transferRequest: MovementRequest = {
        movement_name: 'Transfer',
        movement_val: 500,
        movement_date: '2023-01-01',
        movement_type: '8',
        movement_tag: 'transfer',
        currency: 'USD',
      };

      expect(incomeRequest.movement_type).toBe('1');
      expect(expenseRequest.movement_type).toBe('2');
      expect(transferRequest.movement_type).toBe('8');
    });

    it('should handle different currencies', () => {
      const usdRequest: MovementRequest = {
        movement_name: 'USD Movement',
        movement_val: 100,
        movement_date: '2023-01-01',
        movement_type: '1',
        movement_tag: 'usd-tag',
        currency: 'USD',
      };

      const eurRequest: MovementRequest = {
        movement_name: 'EUR Movement',
        movement_val: 85,
        movement_date: '2023-01-01',
        movement_type: '1',
        movement_tag: 'eur-tag',
        currency: 'EUR',
      };

      expect(usdRequest.currency).toBe('USD');
      expect(eurRequest.currency).toBe('EUR');
    });
  });

  describe('MovementUpdateRequest interface', () => {
    it('should create a valid MovementUpdateRequest with id', () => {
      const request: MovementUpdateRequest = {
        id: 123,
        movement_name: 'Updated Movement',
        movement_val: 200,
        movement_date: '2023-02-01',
        movement_type: '2',
        movement_tag: 'updated-tag',
        currency: 'EUR',
      };

      expect(request.id).toBe(123);
      expect(request.movement_name).toBe('Updated Movement');
      expect(request.movement_val).toBe(200);
      expect(request.movement_date).toBe('2023-02-01');
      expect(request.movement_type).toBe('2');
      expect(request.movement_tag).toBe('updated-tag');
      expect(request.currency).toBe('EUR');
    });

    it('should allow partial updates', () => {
      const partialRequest: MovementUpdateRequest = {
        id: 456,
        movement_name: 'Partially Updated',
      };

      expect(partialRequest.id).toBe(456);
      expect(partialRequest.movement_name).toBe('Partially Updated');
      expect(partialRequest.movement_val).toBeUndefined();
      expect(partialRequest.movement_date).toBeUndefined();
      expect(partialRequest.movement_type).toBeUndefined();
      expect(partialRequest.movement_tag).toBeUndefined();
      expect(partialRequest.currency).toBeUndefined();
    });

    it('should extend MovementRequest interface correctly', () => {
      // Test that MovementUpdateRequest has all MovementRequest properties plus id
      const request: MovementUpdateRequest = {
        id: 789,
        movement_name: 'Test',
        movement_val: 100,
        movement_date: '2023-01-01',
        movement_type: '1',
        movement_tag: 'test',
        currency: 'USD',
      };

      // All MovementRequest properties should be available
      expect(request.movement_name).toBe('Test');
      expect(request.movement_val).toBe(100);
      expect(request.movement_date).toBe('2023-01-01');
      expect(request.movement_type).toBe('1');
      expect(request.movement_tag).toBe('test');
      expect(request.currency).toBe('USD');

      // Plus the id property
      expect(request.id).toBe(789);
    });
  });

  describe('Edge cases and boundary values', () => {
    it('should handle empty strings in InitialLoadRequest', () => {
      const request: InitialLoadRequest = {
        username: '',
        currency: '',
        date: '',
        start_date: '',
        end_date: '',
      };

      expect(request.username).toBe('');
      expect(request.currency).toBe('');
      expect(request.date).toBe('');
      expect(request.start_date).toBe('');
      expect(request.end_date).toBe('');
    });

    it('should handle empty strings in MovementRequest', () => {
      const request: MovementRequest = {
        movement_name: '',
        movement_val: 0,
        movement_date: '',
        movement_type: '',
        movement_tag: '',
        currency: '',
      };

      expect(request.movement_name).toBe('');
      expect(request.movement_val).toBe(0);
      expect(request.movement_date).toBe('');
      expect(request.movement_type).toBe('');
      expect(request.movement_tag).toBe('');
      expect(request.currency).toBe('');
    });

    it('should handle zero and negative values', () => {
      const request: MovementRequest = {
        movement_name: 'Zero Movement',
        movement_val: 0,
        movement_date: '2023-01-01',
        movement_type: '1',
        movement_tag: 'zero',
        currency: 'USD',
      };

      const negativeRequest: MovementRequest = {
        movement_name: 'Negative Movement',
        movement_val: -100,
        movement_date: '2023-01-01',
        movement_type: '2',
        movement_tag: 'negative',
        currency: 'USD',
      };

      expect(request.movement_val).toBe(0);
      expect(negativeRequest.movement_val).toBe(-100);
    });

    it('should handle large numbers', () => {
      const request: MovementRequest = {
        movement_name: 'Large Movement',
        movement_val: 999999999.99,
        movement_date: '2023-01-01',
        movement_type: '1',
        movement_tag: 'large',
        currency: 'USD',
      };

      expect(request.movement_val).toBe(999999999.99);
    });

    it('should handle special characters in names and tags', () => {
      const request: MovementRequest = {
        movement_name: 'Special!@#$%^&*()_+',
        movement_val: 100,
        movement_date: '2023-01-01',
        movement_type: '1',
        movement_tag: 'tag-with-dashes_and_underscores',
        currency: 'USD',
      };

      expect(request.movement_name).toBe('Special!@#$%^&*()_+');
      expect(request.movement_tag).toBe('tag-with-dashes_and_underscores');
    });

    it('should handle unicode characters', () => {
      const request: MovementRequest = {
        movement_name: 'Movimiento Español ñáéíóú',
        movement_val: 100,
        movement_date: '2023-01-01',
        movement_type: '1',
        movement_tag: 'etiqueta-española',
        currency: 'EUR',
      };

      expect(request.movement_name).toBe('Movimiento Español ñáéíóú');
      expect(request.movement_tag).toBe('etiqueta-española');
    });
  });

  describe('Type safety validation', () => {
    it('should enforce string types for movement_type', () => {
      const request: MovementRequest = {
        movement_name: 'Test',
        movement_val: 100,
        movement_date: '2023-01-01',
        movement_type: '1', // Must be string, not number
        movement_tag: 'test',
        currency: 'USD',
      };

      expect(typeof request.movement_type).toBe('string');
      expect(request.movement_type).toBe('1');
    });

    it('should handle different date formats', () => {
      const request: MovementRequest = {
        movement_name: 'Test',
        movement_val: 100,
        movement_date: '2023-01-01T00:00:00.000Z', // ISO format
        movement_type: '1',
        movement_tag: 'test',
        currency: 'USD',
      };

      expect(request.movement_date).toBe('2023-01-01T00:00:00.000Z');
    });
  });
});
