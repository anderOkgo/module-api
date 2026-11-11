import { BitacoraRepository } from '../ports/bitacora.repository';
import { BodyCipher } from '../ports/body-cipher';
import { Entry } from '../../domain/entities/entry.entity';
import { isEntryDate } from '../../domain/services/entry-dates';
import { checkBaseVersion, checkBody } from '../../domain/services/entry-rules';
import {
  badRequest,
  Clock,
  conflict,
  INVALID_DATE,
  isUserId,
  succeed,
  systemClock,
  unauthorized,
  UseCaseResult,
} from './use-case-result';

/**
 * C5 `PUT /entries/:date`: create (201) or replace (200) the entry, unless it
 * changed since the client saw `baseVersion` (409 with the stored entry,
 * nothing written).
 */
export class SaveEntryUseCase {
  constructor(private readonly repository: BitacoraRepository, private readonly clock: Clock = systemClock) {}

  async execute(userId: unknown, date: unknown, request: unknown, cipher: BodyCipher): Promise<UseCaseResult<Entry>> {
    if (!isUserId(userId)) return unauthorized();

    const { body, baseVersion } = (request ?? {}) as { body?: unknown; baseVersion?: unknown };
    const validDate = isEntryDate(date, this.clock());
    const checkedBody = checkBody(body);
    const checkedVersion = checkBaseVersion(baseVersion);
    if (!validDate || !checkedBody.ok || !checkedVersion.ok) {
      return badRequest([
        ...(validDate ? [] : [INVALID_DATE]),
        ...(checkedBody.ok ? [] : checkedBody.errors),
        ...(checkedVersion.ok ? [] : checkedVersion.errors),
      ]);
    }

    const outcome = await this.repository.saveEntry(userId, date, checkedBody.value, checkedVersion.value, cipher);
    if (outcome.kind === 'conflict') return conflict(outcome.entry, 'The entry changed on another device');
    return outcome.kind === 'created'
      ? succeed(outcome.entry, 'Entry created', 201)
      : succeed(outcome.entry, 'Entry saved');
  }
}
