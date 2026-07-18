# Series Module (`src/modules/series/`) — CQRS

The only module implemented with full CQRS: separate write/read repositories, and a command/query handler per operation. Anime catalog management — CRUD, images, genres, demographics, alternative titles, search.

## Structure

```
series/
├── domain/
│   ├── entities/series.entity.ts      # Series, SeriesCreateRequest/UpdateRequest/Response, Genre, Title, Demographic
│   └── ports/image-processor.port.ts
├── application/
│   ├── commands/ + queries/            # Command/query DTOs
│   ├── handlers/commands/ + handlers/queries/   # One handler per operation
│   ├── ports/
│   │   ├── series-write.repository.ts
│   │   └── series-read.repository.ts
│   ├── services/image.service.ts       # Application-level orchestration over ImageProcessorPort
│   └── common/                         # Command/Query base interfaces
└── infrastructure/
    ├── controllers/series.controller.ts  # Single controller, injected with all 16 handlers
    ├── persistence/
    │   ├── series-write.mysql.ts       # DB: MYDATABASEANIME (animecre_cake514)
    │   └── series-read.mysql.ts
    ├── services/image-processor.service.ts  # Sharp adapter
    ├── config/series.module.ts         # Composition Root
    └── documentation/series.swagger.ts
```

## Endpoints (`/api/series`, route order matters — specific paths before `:id`)

| Method & Path | Auth | Handler |
|---|---|---|
| `POST /` | none | `GetProductionsHandler` (boot/legacy filter endpoint) |
| `GET /years` | none | `GetProductionYearsHandler` |
| `GET /list` | `validateToken` | `GetAllSeriesHandler` |
| `POST /search` | none | `SearchSeriesHandler` |
| `POST /create` | `validateAdmin` | `CreateSeriesHandler` (multipart, real image upload) |
| `POST /create-complete` | `validateAdmin` | `CreateSeriesCompleteHandler` (JSON body, one-shot create+genres+titles) |
| `GET /genres` | none | `GetGenresHandler` |
| `GET /demographics` | none | `GetDemographicsHandler` |
| `GET /:id` | none | `GetSeriesByIdHandler` |
| `PUT /:id` | `validateAdmin` | `UpdateSeriesHandler` (multipart) |
| `DELETE /:id` | `validateAdmin` | `DeleteSeriesHandler` (soft delete) |
| `PUT /:id/image` | `validateAdmin` | `UpdateSeriesImageHandler` |
| `POST /:id/genres` / `DELETE /:id/genres` | `validateAdmin` | `AssignGenresHandler` / `RemoveGenresHandler` |
| `POST /:id/titles` / `DELETE /:id/titles` | `validateAdmin` | `AddTitlesHandler` / `RemoveTitlesHandler` |

## Image processing

`src/infrastructure/services/image.ts` (shared, not series-specific) via Sharp: resize to **190×285px**, JPEG quality starting at **90**, target **≤20KB** — if over budget, quality steps down gradually (90→...→30 in decreasing steps) before falling back to more aggressive compression. Filenames are `{id}_{timestamp}.jpg` (the timestamp suffix is deliberate cache-busting, added after image updates started reusing the same id-based name).

## Real, non-obvious business rules

Full detail and enforcement points are in **`docs/ACCEPTANCE_CRITERIA.md`**:

1. **`qualification` is silently rescaled on every write, not stored verbatim** (Catalog #1): `update_rank()` re-ranks the *entire* catalog after every create/update and interpolates every row's qualification onto an evenly-spaced 7.000–9.700 scale — reserving decimal room to insert new series between existing ones later. A client's submitted qualification is never the value that actually gets stored.
2. **`visible` must round-trip as a real JSON boolean** (Catalog #2): `GET` returns `Boolean(row.visible)`, never a raw `0`/`1` — the admin panel re-submits exactly what `GET` returned on the next `PUT` without touching the checkbox, so a non-boolean here previously caused a real production incident (a visible series silently going invisible on an unrelated edit).
3. **`DELETE /:id` is a soft delete** (Catalog #4): sets `visible = 0`, never removes the row or its image — unlike `finan`'s hard delete. There is no hard-delete endpoint; disposable test fixtures accumulate as invisible rows.
4. **`create` / `create-complete` are upsert-by-(name, year), not pure inserts** (Catalog #5): both check for an existing series with the same `name`+`year` first and update it (diffing genres/titles for `create-complete`) instead of creating a duplicate — the opposite of `finan`'s duplicate-prevention, which returns the original untouched (Catalog #11).
5. **`assignGenres` is transactional** (Phase 5): the delete-then-insert pair runs inside `SeriesWriteRepository.runInTransaction()` so a failed insert (e.g. bad FK) can't leave a series with zero genres — this used to be two independent statements with no rollback.
6. **The `UpdateImangeTr` trigger that used to overwrite `image` on insert was removed** (Phase 5, `animecream-data`) — the app manages `image` correctly post-insert via the real auto-increment id; the trigger's `SELECT MAX(id)+1` was racy and redundant.

## CQRS specifics

- Write repository (`SeriesWriteMysqlRepository`) owns all mutation logic, ranking, and the transaction helper.
- Read repository (`SeriesReadMysqlRepository`) is read-only, including the legacy dynamic-filter `getProductions()` query builder used by the `POST /` boot endpoint.
- `finan` and `auth` deliberately do **not** use CQRS — classic use-cases are enough for their simpler read/write shape; this was a considered choice (see `docs/architecture.md`), not an oversight.

## Testing

- `test/modules/series/**/*.test.ts` — unit tests per handler/repository, 100% coverage.
- `test/integration/series.integration.test.ts` — real Express app + real `sharp` image processing on upload, mocked repositories.
- `test/e2e/series.e2e.test.ts` — full CRUD + genre/title relations against the real catalog, including the real atomic-rollback regression test for `assignGenres`.
- `scripts/smoke-test.js` — all 16 routes across public/user/admin tiers, including the qualification-rescale, visible-boolean-round-trip, soft-delete, and upsert-by-name+year checks.

---

**Last verified against source**: 2026-07-18
