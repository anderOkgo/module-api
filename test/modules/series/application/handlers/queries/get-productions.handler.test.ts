import { GetProductionsHandler } from '../../../../../../src/modules/series/application/handlers/queries/get-productions.handler';
import { GetProductionsQuery } from '../../../../../../src/modules/series/application/queries/get-productions.query';
import { SeriesReadRepository } from '../../../../../../src/modules/series/application/ports/series-read.repository';

const mockReadRepository: jest.Mocked<SeriesReadRepository> = {
  findById: jest.fn(),
  findByNameAndYear: jest.fn(),
  findAll: jest.fn(),
  search: jest.fn(),
  getProductions: jest.fn(),
  getGenres: jest.fn(),
  getDemographics: jest.fn(),
  getProductionYears: jest.fn(),
};

describe('GetProductionsHandler', () => {
  let handler: GetProductionsHandler;

  beforeEach(() => {
    handler = new GetProductionsHandler(mockReadRepository);
    jest.clearAllMocks();
  });

  it('applies the default limit (500) when none is provided', async () => {
    mockReadRepository.getProductions.mockResolvedValue([]);

    await handler.execute(new GetProductionsQuery({}));

    expect(mockReadRepository.getProductions).toHaveBeenCalledWith(expect.objectContaining({ limit: 500 }));
  });

  it('returns the productions from the repository', async () => {
    const productions = [{ id: 1, name: 'Prod' }];
    mockReadRepository.getProductions.mockResolvedValue(productions as any);

    const result = await handler.execute(new GetProductionsQuery({ limit: 20 }));

    expect(result).toBe(productions);
  });

  it('throws when filters is not an object', async () => {
    await expect(handler.execute(new GetProductionsQuery('bad' as any))).rejects.toThrow(
      'Error getting productions: Filters must be an object'
    );
  });

  it('wraps the error when filters is null (skips the not-an-object check, fails accessing .limit)', async () => {
    await expect(handler.execute(new GetProductionsQuery(null as any))).rejects.toThrow(
      /Error getting productions:/
    );
    expect(mockReadRepository.getProductions).not.toHaveBeenCalled();
  });

  it('throws when limit is out of range', async () => {
    await expect(handler.execute(new GetProductionsQuery({ limit: 0 }))).rejects.toThrow(
      /Limit must be between 1 and 10000/
    );
    await expect(handler.execute(new GetProductionsQuery({ limit: 20000 }))).rejects.toThrow(
      /Limit must be between 1 and 10000/
    );
  });

  it('throws when limit is not numeric', async () => {
    await expect(handler.execute(new GetProductionsQuery({ limit: 'abc' as any }))).rejects.toThrow(
      /Limit must be between 1 and 10000/
    );
  });

  it('throws when offset is negative or non-numeric', async () => {
    await expect(handler.execute(new GetProductionsQuery({ limit: 10, offset: -1 }))).rejects.toThrow(
      'Offset must be a non-negative number'
    );
    await expect(
      handler.execute(new GetProductionsQuery({ limit: 10, offset: 'abc' as any }))
    ).rejects.toThrow('Offset must be a non-negative number');
  });

  it('accepts a valid offset', async () => {
    mockReadRepository.getProductions.mockResolvedValue([]);

    await handler.execute(new GetProductionsQuery({ limit: 10, offset: 5 }));

    expect(mockReadRepository.getProductions).toHaveBeenCalledWith(expect.objectContaining({ offset: 5 }));
  });

  it('normalizes production_ranking_number to uppercase ASC/DESC', async () => {
    mockReadRepository.getProductions.mockResolvedValue([]);

    await handler.execute(new GetProductionsQuery({ limit: 10, production_ranking_number: 'asc' as any }));

    expect(mockReadRepository.getProductions).toHaveBeenCalledWith(
      expect.objectContaining({ production_ranking_number: 'ASC' })
    );
  });

  it('throws for an invalid sorting direction', async () => {
    await expect(
      handler.execute(new GetProductionsQuery({ limit: 10, production_ranking_number: 'sideways' as any }))
    ).rejects.toThrow(/Invalid sorting direction/);
  });

  it('wraps repository errors', async () => {
    mockReadRepository.getProductions.mockRejectedValue(new Error('DB down'));

    await expect(handler.execute(new GetProductionsQuery({ limit: 10 }))).rejects.toThrow(
      'Error getting productions: DB down'
    );
  });

  it('wraps non-Error rejections with a generic message', async () => {
    mockReadRepository.getProductions.mockRejectedValue('raw string failure');

    await expect(handler.execute(new GetProductionsQuery({ limit: 10 }))).rejects.toThrow(
      'Error getting productions: Unknown error'
    );
  });
});
