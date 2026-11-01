import { BitacoraRepository } from '../ports/bitacora.repository';
import { DeletedEntry } from '../../domain/entities/entry.entity';
import { isEntryDate, purgeOn } from '../../domain/services/entry-dates';
import {
  badRequest,
  Clock,
  INVALID_DATE,
  isUserId,
  notFound,
  succeed,
  systemClock,
  unauthorized,
  UseCaseResult,
} from './use-case-result';

/** C6 `DELETE /entries/:date`: moves the entry to the trash for 30 days (D19). */
export class DeleteEntryUseCase {
  constructor(private readonly repository: BitacoraRepository, private readonly clock: Clock = systemClock) {}

  async execute(userId: unknown, date: unknown): Promise<UseCaseResult<DeletedEntry>> {
    if (!isUserId(userId)) return unauthorized();
    if (!isEntryDate(date, this.clock())) return badRequest([INVALID_DATE]);

    const moved = await this.repository.moveToTrash(userId, date);
    if (!moved) return notFound('Entry not found');
    return succeed({ date, purgeOn: purgeOn(moved.deletedAt) }, 'Entry moved to the trash');
  }
}
