# Finan Module (`src/modules/finan/`)

Personal financial-movement tracking. **Note the real data model**: there is no `categories` table and no colors/widgets — movements are tagged with a free-text `tag` string and classified by `type_source_id` against a `type_sources` catalog. All 4 endpoints require `validateToken`.

## Structure

```
finan/
├── domain/entities/
│   ├── movement.entity.ts          # Movement, MovementType enum, CreateMovementRequest, UpdateMovementRequest, MovementResponse, InitialLoadResponse
│   └── movement-request.entity.ts
├── application/
│   ├── ports/finan.repository.ts   # FinanRepository interface
│   └── use-cases/
│       ├── get-initial-load.use-case.ts
│       ├── put-movement.use-case.ts     # create
│       ├── update-movement.use-case.ts
│       └── delete-movement.use-case.ts
└── infrastructure/
    ├── persistence/finan.mysql.ts   # DB: MYDATABASEFINAN (animecre_finan)
    ├── models/dataparams.ts
    ├── validation/finan.validation.ts
    ├── controllers/finan.controller.ts
    ├── config/finan.module.ts       # Composition Root
    └── documentation/finan.swagger.ts
```

## Endpoints

| Method & Path | Use case |
|---|---|
| `POST /api/finan/initial-load` | `GetInitialLoadUseCase` |
| `POST /api/finan/insert` | `PutMovementUseCase` |
| `PUT /api/finan/update/:id` | `UpdateMovementUseCase` |
| `DELETE /api/finan/delete/:id` | `DeleteMovementUseCase` |

## Real, non-obvious business rules

These are the ones a rewrite would silently get wrong — the full detail, exact code locations, and smoke-test verification status live in **`docs/ACCEPTANCE_CRITERIA.md`**, referenced by number below. Read that catalog before changing any of this behavior.

1. **Per-user tables, case-insensitive usernames** (Catalog #3): each user's movements live in their own `movements_<username>` table, created on first use. Registration allows uppercase usernames but table names are case-sensitive at the DB level, so every method in `finan.mysql.ts` normalizes via a private `normalizeUsername()` before touching a table — this used to be inconsistent and caused update/delete to silently fail for mixed-case accounts (fixed).
2. **Only 3 of 9 real movement types can be created via the API** (Catalog #6): `MovementType` only defines `INCOME=1`, `EXPENSE=2`, `TRANSFER=8` (the real catalog calls id 8 "balance", not "transfer" — the enum's label is wrong). Six more categories (`saving`, `tax return`, `GYG payment`, `interest`, `visa refund`, `cash exchange`) exist in real historical data and are readable, but rejected on create/update. This is a deliberate, documented limitation, not a bug.
3. **`operate_for` implements a one-way linked-movement adjustment** (Catalog #10): creating a movement with `operate_for: <id>` first loads movement `<id>` and adds/subtracts the new movement's value from it (sign depends on the new movement's type), then inserts the new movement tagged with `log = <id>`. **`log` is not an audit log** — it's the FK back to whichever movement this one adjusted. The adjustment never reverses if the adjusting movement is later edited or deleted.
4. **Duplicate-prevention returns the original record untouched, not an update** (Catalog #11): `POST /insert` checks for an existing movement with the same `name` + `date_movement` per user; if found, returns that existing record as-is (for offline-sync retry idempotency) — even if the new request's value/type/tag differ. This is the opposite of series' create-is-really-upsert behavior (Catalog #5) — don't unify the two.
5. **Hard delete** (Catalog #4): `DELETE /delete/:id` really deletes the row — unlike series, which soft-deletes.
6. **A single hardcoded username (`anderokgo`) unlocks extra fields** on `initial-load` (Catalog #7): `generalInfo`/`tripInfo`, backed by SQL views hardcoded to one specific person's table and tagging convention (Catalog #8) — not a general feature, no role system involved.
7. **The monthly budget calculation encodes one person's specific financial rules** (Catalog #9): fixed `SAVINGS_GOAL`/`FIXED_HEALTH_PENSION` defaults (overridable via a `constants` table row, hardcoded to `currency_id = 2`), a `payroll`/`interest-lulo` stable-income fallback chain, and an `aporte-enlinea` tag excluded from "this month's expenses" since it's already accounted for as a deduction.
8. **`finan.validation.ts`'s validators must actually be wired** — `validateUpdateMovements`/`validateDeleteMovement` exist and are called; historically `updateMovement`/`deleteMovement` used the wrong validator or none at all (fixed, see specification-roadmap.md Phase 2.6).

## Security / correctness hardening (Phase 5, see specification-roadmap.md)

- The 9 finan stored procedures (`finan-data/sql/db-views-procs.sql`) used to build dynamic SQL by concatenating parameter values into quoted literals before `PREPARE`/`EXECUTE` — a real SQL-injection surface. Fixed: values are bound via `EXECUTE ... USING`; only the per-user table name stays dynamic (by design), with a `REGEXP '^[a-z0-9_]+$'` guard as defense in depth.
- `getInitialLoadUseCase`'s `createTableForUser()` call was missing `await` — a race condition on a brand-new user's first request. Fixed.

## Testing

- `test/modules/finan/**/*.test.ts` — unit tests, 100% coverage including the username-normalization regression suite in `finan.mysql.test.ts`.
- `test/integration/finan.integration.test.ts` — real Express app + validation + auth, mocked repository.
- `test/e2e/finan.e2e.test.ts` — real per-user table creation/isolation between two distinct users, real mixed-case username create→update→delete cycle (the Phase 6 bug reproduction).
- `scripts/smoke-test.js` — full CRUD cycle against a real running instance, plus the type-validation-gap and linked-movement checks (Catalog #6, #10, #11).

---

**Last verified against source**: 2026-07-18
