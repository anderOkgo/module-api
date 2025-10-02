import { QueryHandler } from '../../common/query.interface';
import { GetDemographicsQuery, GetDemographicsResponse } from '../../queries/get-demographics.query';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';

export class GetDemographicsHandler implements QueryHandler<GetDemographicsQuery, GetDemographicsResponse> {
  constructor(private readonly readRepository: SeriesReadRepository) {}

  async execute(query: GetDemographicsQuery): Promise<GetDemographicsResponse> {
    // Lectura simple sin validaciones complejas
    const demographics = await this.readRepository.getDemographics();

    return {
      demographics,
      total: demographics.length,
    };
  }
}
