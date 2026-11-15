# A limit per IP on failed logins and codes, and dead code removed

**Date:** 2026-11-15 · **Branch:** `feature/20261115-auth-ip-limit` · **Released in:** https://info.animecream.com, 2026-11-15 (PR #15, `npm run bup`, restarted by the owner)
**Implements:** `module-docs/apps/auth/SPEC.md` v0.6 — S.2 flows, S.3 contract (C1, C2, C5 gain a 429), S.5, S.6 (F1, F3–F5, F7, F8; F2 by unit tests; F6 after release)
**Change ID:** `20261115-auth-ip-limit` (module-api only; no data change)

## Summary
One client IP may fail **20 times in 15 minutes** across the public routes that check a secret: a wrong password
or unknown user on login, a wrong code on registration, a wrong code on the password reset (P11). After that,
those routes answer **429** "Too many attempts, try again later" until 15 minutes have passed since the IP's first
counted failure, before checking anything. No IP or account is exempt (P12). The per-account lock (5 failures,
15 minutes) stays (D9). The unreachable `update`, `delete` and `unlockUser` are gone (G5, P10).

## Contract
| # | Endpoint | Change |
|---|---|---|
| C1 | `POST /api/users/add` | With `verificationCode`: **429** "Too many attempts, try again later" while the IP is over the limit. Without it (asking for a code): no change |
| C2 | `POST /api/users/login` | **429**, same message |
| C5 | `POST /api/users/password-reset/confirm` | **429**, same message |
| C3, C4 | — | No change |

Swagger: `user.swagger.ts` lists the 429 on the three routes (C1's existing "one code a minute" 429 was not
documented; it is now).

## Critical constraints discovered
- **The API had no `trust proxy`** (`src/server.ts`), and production answers with `Server: LiteSpeed` (checked
  read-only on `https://info.animecream.com/health`, 2026-11-15): without it, `req.ip` would be the proxy for every
  client, and one bucket would lock everyone out.
- No rate-limit package in `package.json`; written in the API (D11).

## Implementation
- `application/use-cases/ip-attempt.limiter.ts` (new): `IpAttemptLimiter` — `isBlocked(ip)`, `recordFailure(ip)`,
  a `Map` of `{ first, count }` per IP, expired entries dropped on each failure (memory bounded), an injectable
  clock. `isUnknownAddress()`: no address or a loopback one is **never counted** — if production does not forward
  the client address, the limit stays off instead of locking everyone out. Logs "IP limit reached" once per
  window, without the IP.
- Use cases mark a guess with `failedSecret: true`: login (unknown user, wrong password, the 5th that locks),
  register (`Invalid verification code`; an expired code is not counted), C5 (wrong, expired or used-up code,
  unknown email: one answer per D6, so all count; a malformed email or a short password do not).
- `UserController`: `refuseIfBlocked()` before C1-with-code, C2 and C5; `countFailure()` records the failure and
  strips `failedSecret` from the body. The limiter is the sixth constructor argument (one per module build).
- `src/infrastructure/config/trust-proxy.ts` (new): `trust proxy` = **1 hop** by default, so `req.ip` is the last
  `X-Forwarded-For` entry, the one the proxy appends and the client cannot write. `TRUST_PROXY` overrides it
  (`0` with nothing in front). Set in `buildApp` and in the tests' `buildTestApp`.
- Removed: `update`, `delete`, `unlockUser` from the port and `user.mysql.ts`, their tests and mock entries.

## Verification
- Unit + integration: **1,678 tests, 100% statements, branches, functions and lines** (`npx jest --coverage`,
  e2e excluded), 2026-11-15. New: the limiter (19/20, per IP, window edges, memory bound, one log line, loopback
  and missing addresses never counted), `trustProxySetting`, the controller (429 before the use case, flag
  stripped, C4 and admin reset not limited), and `test/integration/auth-ip-limit.integration.test.ts` over real
  HTTP with `X-Forwarded-For` (F1, F3, F4, F5, a client-written entry ignored, no forwarded address → no limit).
- **Black-box E2E** `scripts/20261115-e2e-auth-ip-limit.js` against the local API built from this branch and the
  local Docker database (no real data), `EMAILHOST` pointed at a host that does not exist: **16/16** — F1 (and no
  account locked by the IP limit), F3, F4 (10 passwords + 5 C5 codes + 5 C1 codes → 429; C4 still 200), F5, F7.
  The throwaway account was deleted.
- Regression: `scripts/20261114-e2e-auth-codes-and-reset.js` **32/32** on the same build (with `E2E_SERVER_LOG`).
- **Negative control F8:** the same build with `isBlocked` returning `false` in the compiled limiter: F1, F4 and
  F5 fail (11 passed, 5 failed). Rebuilt clean afterwards.

## Release and rollback
module-api only: merge, `npm run bup`, the owner clicks Restart in cPanel, check `/health`. Rollback: revert the PR
and deploy. No data change.

## Post-deploy checklist (F6, read-only, from two networks)
1. From the owner's computer: 20 failed logins with a username that does not exist, then one more → 429.
   Then one more sending a made-up `X-Forwarded-For` → still 429 (the client cannot pick its IP).
2. From another network (the phone on mobile data): login works → each client is seen with its own IP.
3. If step 1 never reaches 429, LiteSpeed does not forward the address: the limit is off (nothing breaks);
   look at what the host sends before changing `TRUST_PROXY`.
The owner's computer cannot log in for 15 minutes after step 1 (no exceptions, P12).

## Version history
| Date | Change |
|---|---|
| 2026-11-15 | Created; unit 100% (1,678), E2E 16/16 local, v0.5 E2E 32/32, negative control recorded |
| 2026-11-15 | **Merged** (PR #15, `903d17a`) with #16 on `main` (`b9901fb`): unit 1,678 at 100% on the merged `main` (one rerun: `create-series-complete.command.test.ts` "unique timestamps" failed once and passed 5/5 alone; it waits 1 ms with `setTimeout`, a flaky test not touched here). **Deployed:** `npm run bup`, a second sync said "Nothing to synchronize", the owner restarted in cPanel; `/health` UP, uptime 22 s. Public Swagger lists the 429 and still hides `/add` and `/password-reset/*`. **F6 step 1 in production:** 20 failed logins with a username that does not exist → 400 each, the 21st → 429 "Too many attempts, try again later"; one more with a made-up `X-Forwarded-For` → still 429 (the client cannot pick its IP). Step 2 (another network gets its own count) is the owner's, from the phone |
