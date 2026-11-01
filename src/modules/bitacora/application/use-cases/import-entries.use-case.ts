import { BitacoraRepository } from '../ports/bitacora.repository';
import { ImportResult } from '../../domain/entities/entry.entity';
import { checkImport } from '../../domain/services/entry-rules';
import { badRequest, Clock, isUserId, succeed, systemClock, unauthorized, UseCaseResult } from './use-case-result';

/** C11 `POST /entries/import`: bulk, all-or-nothing, idempotent with "skip" (D18). */
export class ImportEntriesUseCase {
  constructor(private readonly repository: BitacoraRepository, private readonly clock: Clock = systemClock) {}

  async execute(userId: unknown, request: unknown): Promise<UseCaseResult<ImportResult>> {
    if (!isUserId(userId)) return unauthorized();

    const checked = checkImport(request, this.clock());
    if (!checked.ok) return badRequest(checked.errors);

    const result = await this.repository.importEntries(userId, checked.value.items, checked.value.onConflict);
    return succeed(result, 'Import finished');
  }
}
