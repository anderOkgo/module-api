import { Query, QueryHandler } from '../../../../../src/modules/series/application/common/query.interface';

describe('Query Interface', () => {
  describe('Query interface', () => {
    it('should have optional cacheKey property', () => {
      const queryWithCache: Query<string> = {
        cacheKey: 'user-query-123',
      };

      const queryWithoutCache: Query<string> = {};

      expect(queryWithCache.cacheKey).toBe('user-query-123');
      expect(queryWithoutCache.cacheKey).toBeUndefined();
    });

    it('should handle different cache key formats', () => {
      const queries: Query<string>[] = [
        { cacheKey: 'simple-key' },
        { cacheKey: 'complex-key-with-numbers-123' },
        { cacheKey: 'key_with_underscores' },
        { cacheKey: 'key-with-dashes' },
        { cacheKey: 'key.with.dots' },
        { cacheKey: 'key/with/slashes' },
        { cacheKey: 'key\\with\\backslashes' },
      ];

      queries.forEach((query, index) => {
        expect(query.cacheKey).toBeDefined();
        expect(typeof query.cacheKey).toBe('string');
      });
    });

    it('should handle empty cache key', () => {
      const query: Query<string> = {
        cacheKey: '',
      };

      expect(query.cacheKey).toBe('');
    });

    it('should handle very long cache keys', () => {
      const longKey = 'a'.repeat(1000);
      const query: Query<string> = {
        cacheKey: longKey,
      };

      expect(query.cacheKey).toBe(longKey);
      expect(query.cacheKey?.length).toBe(1000);
    });
  });

  describe('QueryHandler interface', () => {
    let mockHandler: QueryHandler<Query<string>, string>;

    beforeEach(() => {
      mockHandler = {
        execute: jest.fn(),
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should implement execute method', async () => {
      const query: Query<string> = {
        cacheKey: 'test-query',
      };

      const expectedResult = 'query result';
      mockHandler.execute.mockResolvedValue(expectedResult);

      const result = await mockHandler.execute(query);

      expect(mockHandler.execute).toHaveBeenCalledWith(query);
      expect(result).toBe(expectedResult);
    });

    it('should handle execute without cache key', async () => {
      const query: Query<string> = {};

      const expectedResult = 'result without cache';
      mockHandler.execute.mockResolvedValue(expectedResult);

      const result = await mockHandler.execute(query);

      expect(result).toBe(expectedResult);
      expect(mockHandler.execute).toHaveBeenCalledWith(query);
    });

    it('should handle execute errors', async () => {
      const query: Query<string> = {
        cacheKey: 'error-query',
      };

      const error = new Error('Query execution failed');
      mockHandler.execute.mockRejectedValue(error);

      await expect(mockHandler.execute(query)).rejects.toThrow('Query execution failed');
    });
  });

  describe('Generic Query with different TResult types', () => {
    it('should work with string result', async () => {
      interface StringQuery extends Query<string> {
        searchTerm: string;
      }

      interface StringQueryHandler extends QueryHandler<StringQuery, string> {}

      const mockHandler: StringQueryHandler = {
        execute: jest.fn(),
      };

      const query: StringQuery = {
        cacheKey: 'string-query',
        searchTerm: 'test',
      };

      const expectedResult = 'search result';
      mockHandler.execute.mockResolvedValue(expectedResult);

      const result = await mockHandler.execute(query);

      expect(result).toBe(expectedResult);
      expect(typeof result).toBe('string');
    });

    it('should work with number result', async () => {
      interface NumberQuery extends Query<number> {
        value: number;
      }

      interface NumberQueryHandler extends QueryHandler<NumberQuery, number> {}

      const mockHandler: NumberQueryHandler = {
        execute: jest.fn(),
      };

      const query: NumberQuery = {
        cacheKey: 'number-query',
        value: 42,
      };

      const expectedResult = 84;
      mockHandler.execute.mockResolvedValue(expectedResult);

      const result = await mockHandler.execute(query);

      expect(result).toBe(expectedResult);
      expect(typeof result).toBe('number');
    });

    it('should work with object result', async () => {
      interface ObjectQuery extends Query<{ id: number; name: string }> {
        id: number;
      }

      interface ObjectQueryHandler extends QueryHandler<ObjectQuery, { id: number; name: string }> {}

      const mockHandler: ObjectQueryHandler = {
        execute: jest.fn(),
      };

      const query: ObjectQuery = {
        cacheKey: 'object-query',
        id: 1,
      };

      const expectedResult = { id: 1, name: 'Test Object' };
      mockHandler.execute.mockResolvedValue(expectedResult);

      const result = await mockHandler.execute(query);

      expect(result).toEqual(expectedResult);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Object');
    });

    it('should work with array result', async () => {
      interface ArrayQuery extends Query<number[]> {
        limit: number;
      }

      interface ArrayQueryHandler extends QueryHandler<ArrayQuery, number[]> {}

      const mockHandler: ArrayQueryHandler = {
        execute: jest.fn(),
      };

      const query: ArrayQuery = {
        cacheKey: 'array-query',
        limit: 5,
      };

      const expectedResult = [1, 2, 3, 4, 5];
      mockHandler.execute.mockResolvedValue(expectedResult);

      const result = await mockHandler.execute(query);

      expect(result).toEqual(expectedResult);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(5);
    });

    it('should work with boolean result', async () => {
      interface BooleanQuery extends Query<boolean> {
        check: string;
      }

      interface BooleanQueryHandler extends QueryHandler<BooleanQuery, boolean> {}

      const mockHandler: BooleanQueryHandler = {
        execute: jest.fn(),
      };

      const query: BooleanQuery = {
        cacheKey: 'boolean-query',
        check: 'exists',
      };

      const expectedResult = true;
      mockHandler.execute.mockResolvedValue(expectedResult);

      const result = await mockHandler.execute(query);

      expect(result).toBe(expectedResult);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Cache key scenarios', () => {
    it('should handle cache key with special characters', () => {
      const specialKeys = [
        'key-with-special-chars!@#$%^&*()',
        'key with spaces',
        'key\twith\ttabs',
        'key\nwith\nnewlines',
        'key with unicode: émojis 🎌',
        'key/with\\mixed\\separators',
      ];

      specialKeys.forEach((key) => {
        const query: Query<string> = { cacheKey: key };
        expect(query.cacheKey).toBe(key);
      });
    });

    it('should handle cache key with query parameters', () => {
      const query: Query<string> = {
        cacheKey: 'search?term=test&limit=10&offset=0',
      };

      expect(query.cacheKey).toBe('search?term=test&limit=10&offset=0');
    });

    it('should handle cache key with JSON-like structure', () => {
      const query: Query<string> = {
        cacheKey: '{"type":"search","filters":{"genre":"action","year":2023}}',
      };

      expect(query.cacheKey).toBe('{"type":"search","filters":{"genre":"action","year":2023}}');
    });
  });

  describe('Edge cases', () => {
    it('should handle null result', async () => {
      interface NullQuery extends Query<null> {}

      interface NullQueryHandler extends QueryHandler<NullQuery, null> {}

      const mockHandler: NullQueryHandler = {
        execute: jest.fn(),
      };

      const query: NullQuery = {
        cacheKey: 'null-query',
      };

      mockHandler.execute.mockResolvedValue(null);

      const result = await mockHandler.execute(query);

      expect(result).toBeNull();
    });

    it('should handle undefined result', async () => {
      interface UndefinedQuery extends Query<undefined> {}

      interface UndefinedQueryHandler extends QueryHandler<UndefinedQuery, undefined> {}

      const mockHandler: UndefinedQueryHandler = {
        execute: jest.fn(),
      };

      const query: UndefinedQuery = {
        cacheKey: 'undefined-query',
      };

      mockHandler.execute.mockResolvedValue(undefined);

      const result = await mockHandler.execute(query);

      expect(result).toBeUndefined();
    });

    it('should handle complex nested object result', async () => {
      interface ComplexQuery
        extends Query<{
          data: { items: Array<{ id: number; nested: { value: string } }> };
          meta: { total: number; page: number };
        }> {
        filters: any;
      }

      interface ComplexQueryHandler
        extends QueryHandler<
          ComplexQuery,
          {
            data: { items: Array<{ id: number; nested: { value: string } }> };
            meta: { total: number; page: number };
          }
        > {}

      const mockHandler: ComplexQueryHandler = {
        execute: jest.fn(),
      };

      const query: ComplexQuery = {
        cacheKey: 'complex-query',
        filters: { genre: 'action' },
      };

      const expectedResult = {
        data: {
          items: [
            { id: 1, nested: { value: 'test1' } },
            { id: 2, nested: { value: 'test2' } },
          ],
        },
        meta: { total: 2, page: 1 },
      };

      mockHandler.execute.mockResolvedValue(expectedResult);

      const result = await mockHandler.execute(query);

      expect(result).toEqual(expectedResult);
      expect(result.data.items).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });
  });
});
