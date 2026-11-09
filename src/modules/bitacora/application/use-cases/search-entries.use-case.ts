import { BitacoraRepository } from '../ports/bitacora.repository';
import { SearchData } from '../../domain/entities/entry.entity';
import { checkSearch, SEARCH_PAGE_SIZE, searchSnippet } from '../../domain/services/entry-rules';
import { badRequest, isUserId, succeed, unauthorized, UseCaseResult } from './use-case-result';

/**
 * C14 `POST /search` (SPEC v1.10): the days whose text holds every word and
 * phrase of the query, newest first, 50 at a time, each with a snippet around
 * the first match of the first term. The query travels in the body and is
 * never echoed in a message (N2).
 */
export class SearchEntriesUseCase {
  constructor(private readonly repository: BitacoraRepository) {}

  async execute(userId: unknown, payload: unknown): Promise<UseCaseResult<SearchData>> {
    if (!isUserId(userId)) return unauthorized();
    const checked = checkSearch(payload);
    if (!checked.ok) return badRequest(checked.errors);

    const { terms, offset } = checked.value;
    const page = await this.repository.searchEntries(userId, terms, SEARCH_PAGE_SIZE, offset);
    const results = page.rows.map((row) => ({ date: row.date, snippet: searchSnippet(row.body, terms[0]) }));

    return succeed({ total: page.total, offset, results }, 'Search done');
  }
}
