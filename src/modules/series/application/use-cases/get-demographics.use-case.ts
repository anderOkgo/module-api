import { ProductionRepository } from '../ports/series.repository';

export class GetDemographicsUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(): Promise<any> {
    try {
      const demographics = await this.repository.getDemographics();
      return demographics;
    } catch (error) {
      throw new Error(`Error getting demographics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
