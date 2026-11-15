# Swagger documents the three series page limits (Animecream G3)

**Date:** 2026-11-15 · **Branch:** `feature/20261115-animecream-gaps` · **Released in:** not yet
**Implements:** `module-docs/apps/animecream/SPEC.md` v0.8 — G3 (P9: document them, behavior unchanged)
**Change ID:** `20261115-animecream-gaps` (the same in `animecream-react` for G2 and G6, and in `finan-react` for G9)

## Summary
Swagger now states the limit of each series list endpoint. No code path changes.

| Endpoint | Default | Max | Out of range |
|---|---|---|---|
| `POST /api/series/` (boot) | 10,000 | 10,000 | 400 below 1 or above 10,000 |
| `GET /api/series/list` | 50 | 100 | cut to 100; 0 or less → 50 |
| `POST /api/series/search` | 50 | 100 | cut to 100; 0 or less → 50 |

## Found while checking
`docs/ACCEPTANCE_CRITERIA.md` #26 said the boot endpoint defaults to **500**. Over HTTP it is **10,000**:
`validateProduction()` (`series.validation.ts`) runs first in `SeriesController.getProductions` and always sets
`limit`, so the 500 in `GetProductionsHandler.validateFilters()` is only reached by a direct call with no limit.
#26 is corrected. Nothing else depends on the 500: the fronts send an empty body and expect the whole catalog.

## Files
- `src/modules/series/infrastructure/documentation/series.swagger.ts`: `limit` of `POST /api/series` (integer,
  default 10,000, 1–10,000, the 400), the `/list` note, `limit` added to `POST /search`.
- `docs/ACCEPTANCE_CRITERIA.md` #26.

## Verification
- Against the local API (Docker database, 511 series), 2026-11-15: `POST {}` → 511; `{ "limit": 3 }` and
  `{ "limit": "3" }` → 3; `{ "limit": 10000 }` → 511; `{ "limit": 10001 }` → 400 "Limit cannot exceed 10,000.";
  `{ "limit": 0 }` → 400 "Limit must be a positive number."; `POST /search { "limit": 500 }` → 100.
- `npx tsc --noEmit` passes; unit tests 1,657, 100% statements, branches, functions and lines.

## Release and rollback
module-api: merge, `npm run bup`, the owner restarts in cPanel. It can go with or after PR #15 (auth); the two touch
different files. Rollback: revert.

## Version history
| Date | Change |
|---|---|
| 2026-11-15 | Created; limits checked on the local API |
