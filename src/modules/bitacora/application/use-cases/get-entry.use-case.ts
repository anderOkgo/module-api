import { BitacoraRepository } from '../ports/bitacora.repository';
import { BodyCipher } from '../ports/body-cipher';
import { Entry } from '../../domain/entities/entry.entity';
import { isEntryDate } from '../../domain/services/entry-dates';
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

/** C4 `GET /entries/:date`. */
export class GetEntryUseCase {
  constructor(private readonly repository: BitacoraRepository, private readonly clock: Clock = systemClock) {}

  async execute(userId: unknown, date: unknown, cipher: BodyCipher): Promise<UseCaseResult<Entry>> {
    if (!isUserId(userId)) return unauthorized();
    if (!isEntryDate(date, this.clock())) return badRequest([INVALID_DATE]);

    const entry = await this.repository.findEntry(userId, date, cipher);
    return entry ? succeed(entry, 'Entry loaded') : notFound('Entry not found');
  }
}
