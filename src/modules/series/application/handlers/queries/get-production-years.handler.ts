import { QueryHandler } from '../../common/query.interface';
import { GetProductionYearsQuery, GetProductionYearsResponse } from '../../queries/get-production-years.query';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';

export class GetProductionYearsHandler
  implements QueryHandler<GetProductionYearsQuery, GetProductionYearsResponse>
{
  constructor(private readonly readRepository: SeriesReadRepository) {}

  async execute(query: GetProductionYearsQuery): Promise<GetProductionYearsResponse> {
    // Lectura simple sin validaciones complejas
    const years = await this.readRepository.getProductionYears();

    return {
      years,
      total: years.length,
    };
  }
}
