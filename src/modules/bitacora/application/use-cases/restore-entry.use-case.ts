import { BitacoraRepository } from '../ports/bitacora.repository';
import { Entry } from '../../domain/entities/entry.entity';
import { isEntryDate } from '../../domain/services/entry-dates';
import { checkRestorePolicy } from '../../domain/services/entry-rules';
import {
  badRequest,
  Clock,
  conflict,
  INVALID_DATE,
  isUserId,
  notFound,
  succeed,
  systemClock,
  unauthorized,
  UseCaseResult,
} from './use-case-result';

/**
 * C13 `POST /trash/:date/restore`: puts the newest deleted entry of the date
 * back. If the date has a new entry, `onConflict` decides: "fail" (409 with the
 * current entry), "replace" or "keepBoth".
 */
export class RestoreEntryUseCase {
  constructor(private readonly repository: BitacoraRepository, private readonly clock: Clock = systemClock) {}

  async execute(userId: unknown, date: unknown, request: unknown): Promise<UseCaseResult<Entry>> {
    if (!isUserId(userId)) return unauthorized();

    const validDate = isEntryDate(date, this.clock());
    const policy = checkRestorePolicy(((request ?? {}) as { onConflict?: unknown }).onConflict);
    if (!validDate || !policy.ok) {
      return badRequest([...(validDate ? [] : [INVALID_DATE]), ...(policy.ok ? [] : policy.errors)]);
    }

    const outcome = await this.repository.restoreFromTrash(userId, date, policy.value);
    if (outcome.kind === 'notFound') return notFound('Not in the trash, or deleted more than 30 days ago');
    if (outcome.kind === 'conflict') return conflict(outcome.entry, 'The date already has a new entry');
    return succeed(outcome.entry, 'Entry restored');
  }
}
