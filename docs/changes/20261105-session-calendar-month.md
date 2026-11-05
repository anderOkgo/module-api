# Sessions last one calendar month

**Date:** 2026-11-05 · **Branch:** `feature/20261105-session-calendar-month`
**Implements:** `module-docs/apps/auth/SPEC.md` v0.3, §2, backlog B2
**Change ID:** `20261105-session-calendar-month`

## Summary
A token now lasts one calendar month instead of 30 days: 28 to 31 days, ending on the same day of the next month, or
on its last day when that month is shorter. `expiresIn` reports the same value.

## Decisions
- Calculated in UTC, like the rest of the token.
- Tokens already issued keep the 30 days they were signed with.
- `getExpiresInSeconds()` reads the clock on its own, so at a second's boundary it can differ from the token by one
  second. It only informs the client.

## Files modified
- `src/modules/auth/infrastructure/services/jwt-token-generator.service.ts`, its test
- `scripts/smoke-test.js`, `docs/modules/auth.md`, `docs/ACCEPTANCE_CRITERIA.md` #12

## Release and rollback
Upload the API and restart it in cPanel, before the fronts. Rollback: revert and deploy.

## Version history
| Date | Change |
|---|---|
| 2026-11-05 | Created |
