# Bitácora search: `POST /api/bitacora/search`

**Date:** 2026-11-08 · **Branch:** `feature/20261108-bitacora-search` · **Consumer contract:** `bitacora-react` Search screen · **Released in:** — (pending the owner's go-ahead)
**Implements:** `module-docs/apps/bitacora/SPEC.md` v1.10 — C14 (§3.1, §3.2 "Search terms", "Why POST"), §4.3 C14 row, constraints 8–9, N2, N8, acceptance §6.11 Q1–Q8
**Change ID:** `20261108-bitacora-search`

## Summary
A logged-in user can find their days by what they wrote: `POST /api/bitacora/search` with `{ q, offset? }` returns
the days whose text holds every word and quoted phrase, newest first, 50 at a time, each with a short snippet around
the first match. Case and accents do not matter, and `%`, `_` and `\` are searched as typed. The query is only ever
in a POST body, never in a URL or a log. No data change.

## Context
The owner wants to find days by what was written in them (SPEC D31). The spec agreed on 2026-11-08 a server-side
search: the diary is not on the phone (N7), so the API runs the query.

## Consumer contract
| # | Request | Priority | Status | Note / deviation |
|---|---|---|---|---|
| C14 | `POST /search` `{ q, offset? }` → `{ total, offset, results: [{ date, snippet }] }`, 50 per page, newest first | Must | ✅ | E2E Q1, Q6 |
| C14.a | Terms: `"…"` = phrase, the rest split on whitespace; terms < 2 chars dropped; > 10 terms → 400; unmatched `"` is a plain character | Must | ✅ | E2E Q2, Q5; unit `searchTerms` |
| C14.b | Case- and accent-blind (collation), `%` `_` `\` literal | Must | ✅ | E2E Q3, Q4 |
| C14.c | `snippet` ≤ 200 chars of the body around the first match of the first term, `…` where cut, line breaks as spaces | Must | ✅ | E2E Q1 (202 = 200 + two `…`) |
| C14.d | 400: `q` not a string, empty, > 200 chars after trim, no term left, > 10 terms; `offset` not an integer ≥ 0. 401 without a token or `userId` | Must | ✅ | E2E Q5, S1 |
| N2 | The query and snippets never appear in logs or error messages | Must | ✅ | E2E S5 (run output and server log grepped); a 400 never echoes `q` |

## Critical constraints discovered
1. **The collation already folds case and accents.** `module-data/schemas/bitacora-data/sql/db-structure.sql:10, :29`
   (`utf8mb4_unicode_ci`), so a plain `LIKE` is enough (SPEC constraint 8). Confirmed on MariaDB 10.3: `bogota`
   finds `Bogotá` (E2E Q3).
2. **The controller already never logs bodies or driver errors** (`bitacora.controller.ts` `run()` logs only
   `error.message`), and the repository uses `executeQuery`, not `executeSafeQuery`, whose e-mail and log would carry
   the SQL parameters (`bitacora.mysql.ts` header). The search follows both rules. The `mysql` driver inlines values
   client-side, so a syntax error message could quote one; the search SQL is static (only the number of
   `AND body LIKE ?` varies), so that error cannot come from it.
3. **`/api/bitacora` has its own 10 MB JSON parser** (`bitacora.module.ts` `bitacoraJsonParser`); a 200-character
   query fits any limit.
4. **The local stack needs Docker Desktop** (`docker/docker-compose.yml`, container `animecream-mariadb`): the first
   server start failed with "Error connecting to MySQL" until Docker Desktop and the container were started.

## Decisions
### D1 — Parsing and the snippet are pure domain functions
`searchTerms`, `checkSearch`, `likePattern` and `searchSnippet` live in `domain/services/entry-rules.ts` next to the
other input rules, unit-tested without a database. The front repeats the same parsing to mark matches (SPEC Q13).

### D2 — Two statements, no transaction
`COUNT(*)` for `total`, then the page with `LIMIT 50 OFFSET ?`; the page query is skipped when `total` is 0 or the
offset is past it. A write between the two can make `total` off by one for one request; a transaction buys nothing
for a read-only search.

### D3 — The snippet is cut in the API
Only 50 bodies leave the database and only ≤ 200-character snippets leave the API. The match position is found with
the same folding as the front (lower case, NFD without combining marks), mapped back to the original code points. If
the folding finds no match (a collation equivalence JavaScript does not know, e.g. `ß` = `ss`), the snippet starts at
the beginning of the body.

### D4 — `GET /search` is not routed
Only `router.post('/search')` exists, so a client cannot put the query in a URL even by mistake (404). Checked by the
integration test and E2E S1.

## Discarded alternatives
- `FULLTEXT` index, `GET /search?q=` — rejected in the spec (§Discarded alternatives, D31).
- Escaping with `REPLACE()` in SQL — the escape is done once in TypeScript, where it is unit-tested.

## Endpoint / interface map
| Method | Path | Request | Response | Errors |
|---|---|---|---|---|
| POST | `/api/bitacora/search` | `{ q: string, offset?: integer ≥ 0 }` | `{ total, offset, results: [{ date, snippet }] }` | 400 · 401 |

## Implementation
- **Use case** `SearchEntriesUseCase`: `isUserId` → 401; `checkSearch` → 400; `repository.searchEntries(userId,
  terms, 50, offset)`; one `searchSnippet(body, terms[0])` per row.
- **Repository** `searchEntries`:
  ```sql
  SELECT COUNT(*) AS total FROM entries WHERE user_id = ? AND body LIKE ? ESCAPE '\\' [AND body LIKE ? ESCAPE '\\' …]
  SELECT DATE_FORMAT(entry_date, '%Y-%m-%d') AS date, body FROM entries WHERE <same> ORDER BY entry_date DESC LIMIT ? OFFSET ?
  ```
  each term bound as `likePattern(term)` = `%term%` with `\`, `%`, `_` prefixed by `\`.
- **Route** `router.post('/search', validateToken, …)`; Swagger path `/api/bitacora/search`.

## Behavior by case
| Request | Result |
|---|---|
| `q: "melgar beach"` | days holding both words, newest first |
| `q: "\"left for\""` | days holding that exact phrase |
| `q: "BOGOTA"` | also `Bogotá` |
| `q: "100%"` | only `100%`, not `1000` |
| `q: "a"`, `""`, 201 chars, 11 terms, `offset: -1` | 400, the query not echoed |
| `offset` past the last match | 200, `results: []`, `total` unchanged |
| another user's words | `total: 0` |
| `GET /search?q=…` | 404 |

## Verification
- **Unit + integration:** `npx jest --coverage` → 95 suites, 1,516 tests pass; 100% statements, branches,
  functions and lines (whole repo, bitacora module included). `npx tsc --noEmit` clean (the CI steps).
- **E2E:** `scripts/20261108-e2e-bitacora-search.js` → **38/38 against local** (Docker MariaDB 10.3, API built from
  this branch on port 3001) on 2026-11-08, with `E2E_SERVER_LOG` set: the server log has no query or fixture word.
  Orphan check clean.
- **Negative controls** (playbook §5.3), run once on a build edited in `dist/` only, then rebuilt with `tsc`: with
  `likePattern` not escaping, Q4 fails (3 checks); with the `user_id` filter disabled, Q7 fails (3 checks) and Q3's
  count fails (it sees user B's day) — 30 passed, 7 failed. After the rebuild: 38/38 again.
- **No regression:** `scripts/20261031-e2e-bitacora.js` → 105/105 against local on 2026-11-08 (its server-log check
  was skipped this time: `E2E_SERVER_LOG` not set).
- Expected 4xx during the E2E: Q5 (400), S1 (401), the GET control (404).

## Files created / modified
| File | Change |
|---|---|
| `src/modules/bitacora/domain/entities/entry.entity.ts` | `SearchHit`, `SearchData`, `SearchPage` |
| `src/modules/bitacora/domain/services/entry-rules.ts` | `searchTerms`, `checkSearch`, `likePattern`, `searchSnippet`, constants |
| `src/modules/bitacora/application/ports/bitacora.repository.ts` | `searchEntries` |
| `src/modules/bitacora/application/use-cases/search-entries.use-case.ts` | new |
| `src/modules/bitacora/infrastructure/persistence/bitacora.mysql.ts` | `searchEntries` |
| `src/modules/bitacora/infrastructure/controllers/bitacora.controller.ts` | `searchEntries` handler |
| `src/modules/bitacora/infrastructure/config/bitacora.module.ts` | use case + `POST /search` |
| `src/modules/bitacora/infrastructure/documentation/bitacora.swagger.ts` | `/api/bitacora/search` |
| `test/modules/bitacora/domain/services/search-rules.test.ts` | new |
| `test/modules/bitacora/application/use-cases/search-entries.use-case.test.ts` | new |
| `test/modules/bitacora/infrastructure/persistence/bitacora.mysql.search.test.ts` | new |
| `test/integration/bitacora.integration.test.ts`, `…/bitacora.use-cases.test.ts`, `…/bitacora.swagger.test.ts` | new route, mock method, path list |
| `scripts/20261108-e2e-bitacora-search.js` | new E2E |
| `scripts/smoke-test.js` | `POST /api/bitacora/search` in the 401 gate list |
| `docs/modules/bitacora.md`, `docs/ACCEPTANCE_CRITERIA.md` (#36) | long-lived docs |

## Release and rollback
API only; no migration (E.4: data → API → front, and there is no data step). `npm run bup`, then the owner restarts
the app in cPanel. The front (`bitacora-react`) ships after this, since it calls the new route. Rollback: revert the
merge and deploy; nothing else depends on the route until the front ships.

## Post-deploy checklist
- [ ] `GET /health` 200 after the restart.
- [ ] `node scripts/smoke-test.js` against production (read-only): `POST /api/bitacora/search` → 401 without and
      with a bad token.
- [ ] Swagger lists `/api/bitacora/search`.
- [ ] N8 (< 500 ms with a common word on the owner's data) is measured from the front, once it ships, by the owner.

## Open questions
None.

## Bugs found during development
1. **`likePattern` did not escape.** The function was first written through a shell heredoc, which ate one
   backslash in each of `/[\\%_]/` and `` `\\${c}` ``: the pattern no longer matched `\`, and each `%` or `_` became
   the literal text `${c}`. Not seen before because nothing had run yet; the unit test of Q4 (`likePattern`) and
   the repository test failed at once. Fixed in the source; the two tests now pin the exact escaped strings.

## Version history
| Date | Change |
|---|---|
| 2026-11-08 | Created; implemented; unit 1,516 at 100%, E2E 38/38 local, negative controls recorded |
