import { QueryHandler } from '../../common/query.interface';
import { GetGenresQuery, GetGenresResponse } from '../../queries/get-genres.query';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';

export class GetGenresHandler implements QueryHandler<GetGenresQuery, GetGenresResponse> {
  constructor(private readonly readRepository: SeriesReadRepository) {}

  async execute(query: GetGenresQuery): Promise<GetGenresResponse> {
    // Simple read without complex validations
    const genres = await this.readRepository.getGenres();

    return {
      genres,
      total: genres.length,
    };
  }
}
