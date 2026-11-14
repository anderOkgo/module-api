# Codes that expire, and password reset by email

**Date:** 2026-11-14 · **Branch:** `feature/20261114-auth-codes-and-reset` · **Released in:** https://info.animecream.com, 2026-11-14 (PR #14, `npm run bup`, restarted by the owner)
**Implements:** `module-docs/apps/auth/SPEC.md` v0.5 — R.2 flows, R.3 contract (C1 changed, C4, C5), R.5, R.6 (E1–E9, E11)
**Change ID:** `20261114-auth-codes-and-reset` (the same in `module-data` and `finan-react`)

## Summary
Emailed codes now follow one policy for registration and password reset (D3, D5): they live **15 minutes**,
take **5 wrong tries** (the 5th deletes the code), and one is sent **a minute** per email and purpose; a new code
replaces the old one. Two new endpoints let a person reset their own password with a code (C4, C5). Codes are no
longer written to the log, and the code emails are in Spanish and English (P9).

## Contract
| # | Endpoint | Change |
|---|---|---|
| C1 | `POST /api/users/add` | New answers: 400 "Verification code expired"; **429** "Too many requests, try again in a minute" (the body has no `status` field) |
| C4 | `POST /api/users/password-reset/request` `{ email }` | New. 200 "If an account uses this email, a code was sent" — always the same, even within the minute; 400 "Invalid email format" |
| C5 | `POST /api/users/password-reset/confirm` `{ email, code, newPassword }` | New. 200 "Password changed"; 400 "Invalid or expired code" (one message for every reason); 400 for a password under 6 characters |

Swagger: `user.swagger.ts`; production hides C4 and C5, as it hides C1 (`swagger.ts`).

## Implementation
- `application/use-cases/verification-code.policy.ts` (new): `issue()` and `check()`, ages from the database clock
  (`TIMESTAMPDIFF` in the query), so API and table never disagree on time.
- `application/use-cases/password-reset.use-case.ts` (new): C4 and C5. C5 also clears the login lock and count,
  like the admin reset; sessions open elsewhere stay open (D7, P8).
- `register.use-case.ts`: uses the policy; the private code helpers are gone.
- Repository port and MySQL adapter: `saveVerificationCode(email, code, purpose)` now **replaces** earlier codes,
  `findVerificationCode`, `incrementVerificationAttempts`, `deleteVerificationCode(email, purpose)`;
  `validateVerificationCode` removed (the check lives in the policy).
- `smtp-email.service.ts`: Spanish and English texts; the log says only "Verification code sent" /
  "Password reset code sent" (before: the email and the code, K4).

## Deviation from the spec, and why
The spec said C4 answers **429** within a minute. Only accounts store reset codes, so a 429 would tell which
emails have an account — against D6. C4 answers the same 200 and sends nothing. C1 keeps its 429: registration
already says "Email already exists". The spec was updated to match.

## Verification
- Unit + integration: **1,657 tests, 100% statements, branches, functions and lines** (`npx jest --coverage`,
  e2e excluded). New suites: the policy (numbers, 59/60 s, 899/900 s, 4th/5th wrong try, string codes), both reset
  use cases, controller C4/C5 and the 429; the email test asserts the log holds neither code nor email.
- Jest E2E on the local database (`test/e2e/auth.e2e.test.ts`): 7/7.
- **Black-box E2E** `scripts/20261114-e2e-auth-codes-and-reset.js` against the local API built from this branch and
  the local Docker database (no real data; migration 0002 applied), with `EMAILHOST` pointed at a host that does
  not exist so no email left the machine: **32/32** — E1, E2, E3, E4, E5 (+ the same 200 within the minute), E6,
  E7, E8, E9 (the server log grepped: no code, no email). The throwaway account and its codes were deleted.
- **Negative control E11:** the same build with the expiry check removed (`if (false)` in the compiled policy):
  E1 fails (13 passed, 3 failed). The build was rebuilt clean afterwards.

## Release and rollback
Order (playbook E.4): **module-data migration 0002 first**, then this API (`npm run bup`), then `finan-react`.
The API before this change works on the migrated table, so step 1 can go alone. Rollback: revert the PR and
deploy; the table change can stay.

## Post-deploy checklist
- `POST /api/users/password-reset/request` with an email that has no account → 200, the agreed message.
- Swagger in production does not list `/password-reset/*`.
- The owner registers or resets with a real email once: the email arrives in both languages; the server log
  shows no code.

## Version history
| Date | Change |
|---|---|
| 2026-11-14 | Created; unit 100%, E2E 32/32 local, negative control recorded |
