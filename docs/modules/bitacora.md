# Bitácora Module (`src/modules/bitacora/`)

Private daily journal: one entry per user per calendar date, "on this day" in other years, a
30-day trash. **The contract is not defined here**: the source of truth is
`module-docs/apps/bitacora/SPEC.md` (v1.0, §3 contract, §4 data). This file describes how the code
implements it. Change: `docs/changes/20261031-bitacora-day0.md`.

## Structure

```
bitacora/
├── domain/
│   ├── entities/entry.entity.ts        # Entry, HomeData, TrashItem, ImportItem, policies
│   └── services/
│       ├── entry-dates.ts              # calendar-date rules: valid range, D5 pairs, ±3-day window, month range, purgeOn
│       └── entry-rules.ts              # body / baseVersion / onConflict / import validation
├── application/
│   ├── ports/bitacora.repository.ts    # BitacoraRepository: every method takes userId first
│   └── use-cases/                      # one per endpoint, return UseCaseResult (never throw for expected failures, D2)
│       ├── use-case-result.ts
│       ├── get-home / get-nearby / get-entry / save-entry / delete-entry
│       └── list-month / list-trash / restore-entry / import-entries
└── infrastructure/
    ├── persistence/bitacora.mysql.ts   # DB: MYDATABASEBITACORA (animecre_bitacora)
    ├── controllers/bitacora.controller.ts
    ├── config/bitacora.module.ts       # Composition root, routes, bitacoraJsonParser
    └── documentation/bitacora.swagger.ts
```

## Endpoints (all under `/api/bitacora`, all behind `validateToken`)

| Method & path | Use case | Spec |
|---|---|---|
| `GET /home/:date` | `GetHomeUseCase` | C2 |
| `GET /entries/:date/nearby` | `GetNearbyUseCase` | C3 |
| `GET /entries/:date` | `GetEntryUseCase` | C4 |
| `PUT /entries/:date` | `SaveEntryUseCase` | C5 |
| `DELETE /entries/:date` | `DeleteEntryUseCase` | C6 |
| `GET /entries?month=YYYY-MM` | `ListMonthUseCase` | C7 |
| `POST /entries/import` | `ImportEntriesUseCase` | C11 |
| `GET /trash` | `ListTrashUseCase` | C12 |
| `POST /trash/:date/restore` | `RestoreEntryUseCase` | C13 |

Envelope (D3): `{ success, message, data?, errors? }`; 409 responses carry the stored entry in `data`.

## Rules worth knowing before changing this module

- **Keyed by `userId`, never `username`** (SPEC D1). The token middleware is the only source of
  `req.body.userId`; it removes any client-sent value. A request whose token has no numeric
  `userId` gets 401 from the use case.
- **No `executeSafeQuery`.** It e-mails and logs the failing SQL, which can contain entry text
  (N2). The repository uses `executeQuery` / `runInTransaction` (they throw); the controller logs
  only `error.message`.
- **Dates are formatted in SQL** (`DATE_FORMAT`), because the pool has no `dateStrings` and would
  shift `DATE`/`DATETIME` values through the server's time zone. Timestamps are written with
  `UTC_TIMESTAMP()` and returned as `YYYY-MM-DDTHH:MM:SSZ`.
- **Body limit.** `bitacoraJsonParser` (10 MB) is mounted on `/api/bitacora` in `server.ts` before
  the global `express.json()` (100 kB): one 100,000-character entry or a 1,000-item import exceeds
  100 kB.
- **Concurrency (C5).** `saveEntry` locks the row (`SELECT … FOR UPDATE`) and compares `version`
  with `baseVersion` inside one transaction. Two simultaneous *first* saves of a date: the loser's
  `ER_DUP_ENTRY` / `ER_LOCK_DEADLOCK` becomes a 409 with the winner's entry.
- **Trash (D19).** Delete moves the row to `entries_trash`; expired rows (> 30 days) are purged
  lazily at the start of every delete, trash list and restore. Restore takes the newest trash row
  of the date; "keep both" stores the current text, a blank line, then the deleted text (§2.3).
- **Nearby (C3).** An entry belongs to the year of its anchor date (entry date minus its offset):
  for Jan 2, the Dec 30 just before it is the same year, not "1 year ago".

## Tests

- Unit: `test/modules/bitacora/` (domain rules, use cases, repository SQL with a mocked `Database`).
- Integration: `test/integration/bitacora.integration.test.ts` (real router, middleware and use
  cases; repository mocked): 401 on every route, route ordering (S4), envelope, no text in logs.
- Black-box contract E2E: `scripts/20261031-e2e-bitacora.js` (SPEC §6 API cases), run against a
  real database.

---

**Last verified against source**: 2026-11-01
