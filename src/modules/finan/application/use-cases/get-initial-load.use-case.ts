import { FinanRepository } from '../ports/finan.repository';
import { InitialLoadRequest } from '../../domain/entities/movement-request.entity';

export class GetInitialLoadUseCase {
  constructor(private readonly repository: FinanRepository) {}

  async execute(data: InitialLoadRequest): Promise<any> {
    return await this.repository.getInitialLoad(data);
  }
}
