# Bound parameters in assignGenres

**Date:** 2026-11-05 · **Branch:** `fix/20261105-assign-genres-params`
**Implements:** `module-docs/apps/animecream/SPEC.md` v0.2, backlog B2, gap G4
**Change ID:** `20261105-assign-genres-params`

## Summary
`assignGenres()` built its `INSERT` by interpolating ids. It was safe only because every caller validated
first (acceptance #28). Now every value is a bound parameter. No behavior changes.

## Found while testing
`test/e2e/series.e2e.test.ts` failed on `main` too: it expected a genre-less series to be hidden, which the
view stopped doing on 2026-07-19. The E2E suite does not run in CI, so nobody saw it. Test and acceptance #23
now state the current behavior.

## Files modified
- `src/modules/series/infrastructure/persistence/series-write.mysql.ts`
- `test/modules/series/infrastructure/persistence/series-write.mysql.test.ts`
- `test/e2e/series.e2e.test.ts`
- `docs/ACCEPTANCE_CRITERIA.md` — #23, #28

## Release and rollback
Upload the API and restart it in cPanel. Rollback: revert and deploy.

## Version history
| Date | Change |
|---|---|
| 2026-11-05 | Created |
