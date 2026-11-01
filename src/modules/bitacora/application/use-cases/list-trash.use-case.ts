import { BitacoraRepository } from '../ports/bitacora.repository';
import { TrashItem } from '../../domain/entities/entry.entity';
import { purgeOn } from '../../domain/services/entry-dates';
import { isUserId, succeed, unauthorized, UseCaseResult } from './use-case-result';

/** C12 `GET /trash`: entries deleted in the last 30 days, newest deletion first. */
export class ListTrashUseCase {
  constructor(private readonly repository: BitacoraRepository) {}

  async execute(userId: unknown): Promise<UseCaseResult<TrashItem[]>> {
    if (!isUserId(userId)) return unauthorized();

    const rows = await this.repository.listTrash(userId);
    return succeed(
      rows.map((row) => ({ ...row, purgeOn: purgeOn(row.deletedAt) })),
      'Trash loaded'
    );
  }
}
