# Acceptance Criteria Catalog

**Status: living document** — grows whenever a bug hunt or investigation surfaces a new non-obvious business rule. Last entry added 2026-07-18 (#18). Split out of `docs/specification-roadmap.md` on 2026-07-18 so this evergreen reference doesn't keep growing inside that file's day-by-day project log — see that file's Progress log for the history of *how* each entry below was discovered, and Phase 7 for the full reasoning behind why this catalog exists as a separate, language-agnostic layer.

## What this is

The living answer to "how do we surface every acceptance criterion the system enforces, independent of the TypeScript that happens to implement it today." If this backend were ever rewritten from scratch — different language, different test tooling — this catalog plus `scripts/smoke-test.js` are what prove the rewrite is behaviorally equivalent, without either of them depending on this codebase's internals.

## Methodology

**Not every test is an acceptance criterion.** This codebase has 1000+ unit/integration tests; the overwhelming majority are *implementation-robustness* tests (e.g. "throws when the database reports an errorSys", "handles a null query result"), not business rules a rewrite in another language would need to reproduce identically. Trying to extract acceptance criteria by reading every test one by one produces mostly noise. The two categories, and how to tell them apart:

- **Real acceptance criterion**: a rule about *observable behavior* that the business actually depends on — something a from-scratch rewrite must replicate, or real users/data get corrupted or confused. Usually surprising, non-obvious from the endpoint's name alone, and often discovered the hard way (a bug report, a production incident, a "wait, why does it do that?" moment) rather than designed upfront. Example: `visible` must come back from `GET /api/series/:id` as a real JSON boolean, not a raw MySQL 0/1 — because the admin panel round-trips that exact value on the next `PUT` without the user touching the checkbox, so a non-boolean silently flips a visible series to hidden on an unrelated edit.
- **Implementation-robustness test**: proves *this* TypeScript/MySQL implementation doesn't crash or misbehave internally. Valuable for this codebase's day-to-day safety (that's what the 100%-coverage unit suite is for), but not part of the portable contract — a Python rewrite is free to handle a DB connection error completely differently, as long as the *HTTP-observable* result (say, a 500 with an `error` field) stays the same.

**The three-way relationship this catalog is built around:**

```
Acceptance Criteria Catalog (this file, prose)  ←→  scripts/smoke-test.js (executable, HTTP-only)
                    ↓ both constrain, neither depends on ↓
                         source code (any language, regeneratable)
```

This catalog is the human-readable statement of *what* must be true. `scripts/smoke-test.js` is the executable proof that it *is* true, for whatever's actually running, via HTTP only. Source code satisfies both, and — this is the point — could be thrown away and regenerated from scratch, in any language, and as long as it keeps satisfying this catalog and passing the script, it counts as correct.

**How this grows:** don't attempt to enumerate every validation rule in the system in one pass. Start with the *surprising* ones — the ones a careful, competent engineer rewriting this system from the endpoint list alone would still get wrong, because they're invisible without reading deep into the code or living through the bug. Mundane rules (min name length, numeric ranges, required fields) are lower priority — they're usually obvious from the DTO/validation function itself and less likely to be silently lost in a rewrite. Add a new entry whenever a bug hunt or investigation surfaces another one of these.

## Catalog

#### 1. Series qualification is silently rescaled on every write

**Rule:** whatever `qualification` value a client submits for a series is **not** stored verbatim. After every create/update, `update_rank()` re-ranks the *entire* `productions` catalog by qualification and re-normalizes every row's qualification to an evenly-spaced 7.000–9.700 scale by rank position. This is intentional (confirmed with the user): it keeps decimal room to insert new series between existing ones later, since qualification is what determines display order.

**Enforced in:** `animecream-data/sql/db-views-procs.sql` (`update_rank` procedure), invoked by `updateRank()` in `src/modules/series/infrastructure/persistence/series-write.mysql.ts`, called from `create-series.handler.ts`, `update-series.handler.ts`, and `create-series-complete.handler.ts` after every write.

**Verified in `scripts/smoke-test.js`:** yes — the update check asserts the returned qualification falls in the 7.0–9.7 range (not the submitted `7.5`) and that a re-fetch agrees with the response.

#### 2. `visible` must round-trip as a real JSON boolean, not a raw 0/1

**Rule:** `GET /api/series/:id` must return `visible` as an actual `true`/`false`, never the raw MySQL `TINYINT` (`0`/`1`) it's stored as. This isn't cosmetic: the admin edit panel loads a series via `GET`, seeds its visibility checkbox from that response, and — if the user never touches the checkbox — submits that exact same value back on `PUT`. If `GET` ever returns a non-boolean, the round-tripped value can silently fail whatever boolean check the `PUT` handler does, and a visible series goes invisible on an edit that had nothing to do with visibility. This was a real production incident.

**Enforced in:** `mapToResponse()` in `src/modules/series/infrastructure/persistence/series-read.mysql.ts` (`visible: Boolean(row.visible)`), and `parseVisible()` in `src/modules/series/infrastructure/controllers/series.controller.ts` (accepts a real boolean, the string `'true'`/`'false'`, or `1`/`0`/`'1'`/`'0'`, since multipart form-data, JSON bodies, and the round-tripped `GET` value all arrive in different shapes).

**Verified in `scripts/smoke-test.js`:** yes — asserts `typeof visible === 'boolean'` on `GET`, and reproduces the exact round-trip scenario (`GET` → submit that same value back on `PUT` → re-fetch → still visible).

#### 3. Finan usernames are case-insensitive, everywhere

**Rule:** registration allows uppercase letters in usernames, and nothing normalizes that casing at signup — but every finan operation resolves a per-user table as `movements_<username>`, and those table names are case-sensitive at the database level. So the *effective* rule the system must uphold is: every finan operation must treat the username as if it were lowercased, regardless of how it's cased in the JWT/request, or two operations on the same logical user (e.g. create vs. update) silently address two different tables.

**Enforced in:** `normalizeUsername()` in `src/modules/finan/infrastructure/persistence/finan.mysql.ts`, applied in every method that touches a `movements_<username>` table or stored procedure (originally only `create`/initial-load normalized, causing update/delete and linked-movement operations to silently fail or no-op for any mixed-case account — see `docs/specification-roadmap.md` Phase 6 for the bug hunt).

**Verified in `scripts/smoke-test.js`:** yes — the "username-casing regression" check, conditional on the configured test account genuinely having a mixed-case username.

#### 4. Series are soft-deleted; finan movements are hard-deleted — deliberately different per module

**Rule:** `DELETE /api/series/:id` never removes the row — it sets `visible = 0` and the row (and its image) stays forever, because a catalog entry is worth preserving even when hidden. `DELETE /api/finan/delete/:id` performs a real `DELETE FROM movements_<user>`, because a financial movement the user deleted should actually be gone. These are not the same "delete" semantics despite sharing a verb and a route shape — a rewrite that made both hard-deletes (or both soft-deletes) would be behaviorally wrong for one of the two modules.

**Enforced in:** `delete()` in `series-write.mysql.ts` (`UPDATE productions SET visible = 0`) vs. `delete()` in `finan.mysql.ts` (`DELETE FROM movements_<user> WHERE id = ?`).

**Verified in `scripts/smoke-test.js`:** yes — both sides have a follow-up confirmation, not just the `200` on `DELETE` itself: the series check re-fetches and asserts `visible === false`; the finan check re-calls `/initial-load` and asserts the movement is absent.

#### 5. Creating a series with a name+year that already exists updates it instead of creating a duplicate

**Rule:** `POST /api/series/create` and `POST /api/series/create-complete` are not pure "create" endpoints — before inserting, both check whether a series with the same `name` + `year` already exists, and if so, **update** that existing row (and, for `create-complete`, diff and reconcile its genres/titles) instead of creating a second, duplicate entry. The endpoint name suggests create-only; the actual behavior is upsert-by-(name, year).

**Enforced in:** `findByNameAndYear()` calls at the top of `create-series.handler.ts` and `create-series-complete.handler.ts`, branching into the update path when a match is found.

**Verified in `scripts/smoke-test.js`:** yes — a dedicated fixture calls `create` twice with the same name+year, asserts the second call returns the *same* id and reflects the second call's `description`, then does a single cleanup delete. Confirmed against the real DB: exactly one row exists, not two.

#### 6. Movement types: the API can only ever *create* 3 of the 9 real categories

**Rule:** `type_sources` (the real catalog, confirmed against the live database) has 9 rows: `income`(1), `expense`(2), `saving`(7), `balance`(8), `tax return`(9), `GYG payment`(10), `interest`(11), `visa refund`(12), `cash exchange`(13). The TypeScript `MovementType` enum only defines 3 of them — `INCOME=1`, `EXPENSE=2`, `TRANSFER=8` (note: the real catalog calls id 8 `"balance"`, not `"transfer"` — the enum's own label is wrong) — and `PutMovementUseCase`/`UpdateMovementUseCase` validate `movement_type` against `Object.values(MovementType)`, rejecting anything not in {1, 2, 8}. Confirmed against real production data: `movements_anderokgo` has 8 real rows with `type_source_id = 13` (`cash exchange`) and 3 with `8` (`balance`) — meaning **the other 6 categories exist in real historical data (readable via every GET/list endpoint) but can never be created or updated through the API today.** A rewrite that "completed" the enum to match the full catalog would silently change accepted behavior; a rewrite that copied the enum as-is would faithfully reproduce this limitation — the catalog exists precisely so this is a *choice*, not an accident discovered later.

**Enforced in:** `MovementType` enum in `src/modules/finan/domain/entities/movement.entity.ts`; `isValidMovementType()` in `put-movement.use-case.ts` (update-movement has no equivalent type check at all — worth noting as an inconsistency, not just a gap).

**Verified in `scripts/smoke-test.js`:** yes — asserts a create with `movement_type: 13` is rejected (400), confirming the limitation is real and intentional-by-inaction, not a fluke.

#### 7. A single hardcoded username unlocks extra response data

**Rule:** `POST /api/finan/initial-load` returns two extra fields (`generalInfo`, `tripInfo`) if and only if the authenticated username (case-insensitively) equals the literal string `'anderokgo'` — the project owner's own account. There is no role/permission system behind this; it's a single string comparison. Any rewrite must either preserve this exact hardcoded gate or the user must explicitly decide to replace it with a real privilege system.

**Enforced in:** `isPrivilegedUser()` in `get-initial-load.use-case.ts` (`const privilegedUsers = ['anderokgo'];`).

**Verified in `scripts/smoke-test.js`:** **deliberately not automated.** The gate is tied to one specific real person's account, and the two fields it unlocks (see #8) surface real personal financial data — asserting on their presence/values in a shared, disposable-fixture-based script would either be flaky (depends on who's configured as `SMOKE_ADMIN_LOGIN`) or would bake a real identity into test code. Documented here instead; a human running the script as that real account can eyeball the extra fields if needed.

#### 8. "General info" and "trip info" are not general — they're one person's travel/GYG fund tracker

**Rule:** `view_general_info` and `view_final_trip_info` (the SQL views behind #7's extra fields) are hardcoded to `movements_anderokgo` specifically (not parameterized by username at all — see `finan-data/sql/db-views-procs.sql`) and to a fixed set of `tag` string literals: `'GYG payment'`, and trip-tracking tags matched with `LIKE '%trip-melburn%'`, `'%trip-sydney%'`, `'%trip-jap%'`, `'%trip-phi%'`, `'%trip-ind%'`, `'%trip-syd%'`, `'%final-trip%'`, and an exact-match `tag = 'return'`. Despite the generic names, these views only ever make sense for one specific person's specific, personal tagging convention — they are not a general feature of the finan module.

**Enforced in:** `view_general_info`, `view_final_trip_info` in `finan-data/sql/db-views-procs.sql`; surfaced via `getGeneralInfo()`/`getTripInfo()` in `finan.mysql.ts`, gated by #7's `isPrivilegedUser()` check.

**Verified in `scripts/smoke-test.js`:** not automated, same reasoning as #7 (real personal financial data, single hardcoded account and table).

#### 9. The monthly budget calculation embeds a specific personal financial philosophy, not a generic formula

**Rule:** `getMonthlyBudget()` computes "money safe to spend this month" with several non-obvious, hardcoded business decisions: (a) starts from `SUM` of all this-month income-type movements; (b) for the two "stable" tags `payroll` and `interest-lulo` specifically, if the current month has no matching income yet, falls back to a configured `EXPECTED_PAYROLL` constant (for `payroll` only) or to last month's actual value for that tag (matching tag comparisons are done case-insensitively via `LOWER(TRIM(tag))`, even though tags are stored exactly as typed — see #6's sibling note on `type_source_id`); (c) always subtracts a fixed `SAVINGS_GOAL` (default 5,000,000) off the top, whether or not that much was actually saved; (d) always subtracts a health/pension cost — the *real* amount actually tagged `aporte-enlinea` this month if any exists, else a fixed `FIXED_HEALTH_PENSION` default (855,000); (e) never returns a negative number (floors at 0). All three constants can be overridden via the `constants` table (`currency_id = 2` only — hardcoded to one specific currency's row). Separately, `getCurrentMonthExpenses()` explicitly excludes anything tagged `aporte-enlinea` from the "expenses so far this month" total, since (d) already accounts for it — a movement tagged that way is treated as a mandatory deduction, not a discretionary expense.

**Enforced in:** `getMonthlyBudget()` and `getCurrentMonthExpenses()` in `finan.mysql.ts` (including the `SAVINGS_GOAL`/`FIXED_HEALTH_PENSION` static defaults and the `stableTags = ['payroll', 'interest-lulo']` list).

**Verified in `scripts/smoke-test.js`:** not automated. This depends on real historical income/expense data and real `constants` values for one specific real account and currency — there's no safe, disposable way to assert an exact expected number without either using real financial data (risky/sensitive) or reimplementing the whole formula inside the test (which wouldn't prove anything the source doesn't already claim). Documented here as the authoritative description of the *intended* behavior instead.

#### 10. A movement can silently adjust the value of a *different*, earlier movement — one-way, no undo

**Rule:** creating a movement with `operate_for: <id>` set does not just create a new row — it first loads the movement referenced by `<id>` and adjusts *its* stored `value`: adds the new movement's value if the new movement's `movement_type` is `INCOME` (1), subtracts it if `EXPENSE` (2) or `TRANSFER`/`balance` (8). Only then is the new movement inserted, tagged with `log = <id>` (the linked movement's id) — **the `log` column is not an audit log**, despite the name; it's the foreign key back to whichever movement this one adjusted (`0` if none). This adjustment is a **one-way mutation**: if the new (adjusting) movement is later deleted or updated, the original movement's value is *not* reversed or recalculated — whatever it was adjusted to stays that way. If the referenced movement doesn't exist, the whole create is aborted (nothing is inserted). The duplicate-prevention check (#11) runs *before* this adjustment, so retrying an already-processed request never double-adjusts the linked movement.

**Enforced in:** `operateForLinkedMovement()` in `finan.mysql.ts`; `handleLinkedMovement()` in `put-movement.use-case.ts`; the `log` field's real meaning is invisible from `movement.entity.ts`'s type alone (typed as `log?: number` with no comment).

**Verified in `scripts/smoke-test.js`:** yes — creates a movement, then a second one with `operate_for` pointing at the first and a known value, and asserts the first movement's value changed by exactly the expected amount.

#### 11. Re-submitting the same movement (same name + date) returns the *original* untouched — it does not update, unlike series

**Rule:** `POST /api/finan/insert` checks for an existing movement with the same `name` + `date_movement` (per user) before inserting; if one exists, it returns success with the *existing, unmodified* record — even if the new request's value, type, tag, or currency differ from what's stored. This exists to make offline-sync retries idempotent. It is a **materially different upsert semantic from series' create** (entry #5), which *does* update the existing row's fields on a name+year collision — a rewrite that made both endpoints behave the same way (either both update or both no-op) would be wrong for one of them.

**Enforced in:** the `findByNameAndDate()` check at the top of `PutMovementUseCase.execute()`, returning early with `'Movement already exists (duplicate prevented)'` before any insert or linked-movement adjustment.

**Verified in `scripts/smoke-test.js`:** yes — inserts the same movement twice with different `movement_val`, asserts the second call returns the *same* id and the *original* value, not the second call's.

#### 12. The login response lied about the token's real lifetime — found and fixed

**Rule (now enforced, previously violated):** the JWT `POST /api/users/login` issues is genuinely valid for 30 days (`jwt.sign(..., { expiresIn: '30d' })`), but the response's `expiresIn` field reported a hardcoded `86400` (24 hours) — a client trusting that field to decide when to re-authenticate would do so 29 days early, based on false information, for no reason other than the two numbers having been written independently and never kept in sync. **Fixed**: `TokenGeneratorPort` gained `getExpiresInSeconds()`, and `JwtTokenGeneratorService` derives both the JWT's real `expiresIn` string and the seconds value from one single constant (`EXPIRES_IN_DAYS = 30`), so they can never drift apart again. `LoginUserUseCase` now reads the seconds value from the token generator instead of hardcoding it.

**Enforced in:** `jwt-token-generator.service.ts` (`EXPIRES_IN_DAYS`, `getExpiresInSeconds()`), `login.use-case.ts` (`expiresIn: this.tokenGenerator.getExpiresInSeconds()`).

**Verified in `scripts/smoke-test.js`:** yes — the real-login check also asserts `expiresIn` equals `30 * 24 * 60 * 60`, a read-only regression guard against this exact drift recurring. Unit-level: `jwt-token-generator.service.test.ts` cross-checks the claim against the token's own decoded `exp`/`iat`, not just the constant.

#### 13. Accounts lock after the 5th consecutive failed login attempt, for exactly 15 minutes, clearing only on the next successful login

**Rule:** `login_attempts` increments on every wrong password. The lock check reads the count *before* this attempt's increment, so the account locks when that pre-increment count is already `>= 4` — i.e. **on the 5th total consecutive failure**, not the 4th (an easy off-by-one to get wrong reading the `>= 4` alone). The lock lasts exactly 15 minutes (`lockUntil.setMinutes(+15)`). There is no manual unlock and no separate expiry sweep — `login_attempts`/`locked_until` are only ever cleared by `resetLoginAttempts()`, called solely on the *next successful* login (which itself is blocked while `locked_until` is still in the future).

**Enforced in:** `login.use-case.ts` (the `login_attempts >= 4` check and the 15-minute `lockUntil` calculation).

**Verified in `scripts/smoke-test.js`:** **deliberately not automated.** Exercising this for real would require 5 real failed logins against the configured real account, actually locking it for 15 minutes as a side effect of running the smoke test — too disruptive for a shared operational script. Covered thoroughly at the unit level instead (`login.use-case.test.ts`).

#### 14. Login resolves "username or email" with username taking priority

**Rule:** `findByEmailOrUsername()` tries the **username** lookup first; only if that finds nothing (or no username was given) does it fall back to email. If a client somehow supplied both a username and an email belonging to two different real accounts, the username's account wins silently — there's no ambiguity error.

**Enforced in:** `findByEmailOrUsername()` in `user.mysql.ts`.

**Verified in `scripts/smoke-test.js`:** not automated — would need two distinct real accounts deliberately mismatched to observe, not safely constructible from disposable fixtures (registration can't be completed via this script — see entry #7's sibling limitation).

#### 15. Registration can only ever create `role: USER` accounts — there is no API path to create an admin

**Rule:** `RegisterUserUseCase` hardcodes `role: UserRole.USER` on every account it creates; no endpoint anywhere accepts or sets a different role. Every admin account (including whatever `SMOKE_ADMIN_LOGIN` points at) must have been provisioned directly in the database — there is no self-service or API-driven way to promote or create one.

**Enforced in:** `register.use-case.ts` (`role: UserRole.USER` in the `newUser` object).

**Verified in `scripts/smoke-test.js`:** not automated — would require completing a real registration (blocked by email verification) to observe the created role.

#### 16. `UserRepository` fully implements profile update, account deletion, and manual unlock — none of them are reachable through the API

**Rule:** `update()`, `delete()`, and `unlockUser()` are fully implemented at the persistence layer (`user.mysql.ts`) and declared on the `UserRepository` port, but **no use case or controller ever calls them** (confirmed by grepping every call site in `application/`/`infrastructure/controllers/`/`infrastructure/config/` — zero matches). A rewrite that judged the API surface by the repository interface alone would wrongly assume profile editing, account deletion, and manual unlock already exist as real, reachable features. (`updatePassword()` was in the same state until entry #17 wired it up for real.)

**Enforced in:** absence of any caller for `update`/`delete`/`unlockUser` in `src/modules/auth/application/` or `src/modules/auth/infrastructure/controllers/`.

**Verified in `scripts/smoke-test.js`:** not applicable — there is nothing to call; the finding *is* that these paths don't exist yet.

#### 17. New capability: admin password reset (`PUT /api/users/admin/reset-password`)

Added directly motivated by entry #16: a way to actually reset a real account's password (no current password required), gated by `validateAdmin` (real admin JWT required). Built specifically so the project owner can rotate/fix the password on existing test accounts (e.g. to set up a mixed-case-username account for entry #3-style regression testing) without needing direct database access.

**Enforced in:** `admin-reset-password.use-case.ts`, wired in `user.controller.ts`/`auth.module.ts` behind `validateAdmin`. Also clears any existing lockout (`resetLoginAttempts()`) as part of the reset, so a freshly-reset account is immediately usable.

**Verified:** yes, thoroughly, at every layer *except* the smoke test — full unit coverage (`admin-reset-password.use-case.test.ts`), integration coverage (`auth.integration.test.ts`: no-token/non-admin-token rejection, success, user-not-found, short-password rejection), and a real E2E test (`auth.e2e.test.ts`) that resets a real disposable user's password and confirms the old password stops working while the new one succeeds. **Deliberately not added to `scripts/smoke-test.js`**: doing so would mean actually changing a real configured account's real password every time the smoke test runs — the kind of side effect this operational script must never have on shared/production credentials.

#### 18. The JWT secret had two different, mismatched hardcoded fallbacks — found and fixed

**Rule (now enforced, previously violated):** `SECRET_KEY` must be configured in the environment; the application must never sign or verify a token using a hardcoded default. Before this fix, three separate call sites each had their own silent fallback for a missing `SECRET_KEY`, and the three fallbacks didn't even agree with each other: `jwt-token-generator.service.ts` (token *signing*) fell back to `'enterkey'`, while `validate-token.ts` and `validate-admin.ts` (token *verification*) both fell back to `'qwertgfdsa'`. Had `SECRET_KEY` ever gone missing from a real environment (a fresh box, a misconfigured deploy, a `.env` that failed to load), every login would have silently issued a token signed with `'enterkey'`, which every subsequent `validateToken`/`validateAdmin` check would then reject as invalid — total, silent authentication breakage, traceable to nothing more than two string literals never having been kept in sync.

**Fixed:** added `assertRequiredEnvVars()` (`src/infrastructure/config/env.ts`), called once in `server.ts` immediately after `dotenv.config()` and before any other module is imported — so a missing `SECRET_KEY` now crashes the process at genuine startup, before the DB connection is even attempted, rather than surfacing later as a confusing auth failure. All three hardcoded fallback literals (`'enterkey'`, `'qwertgfdsa'` ×2) were deleted outright; the three call sites now read `process.env.SECRET_KEY` directly, trusting the startup guard to have already guaranteed it's set. Verified for real (not just via mocked tests): built the project with `tsc`, ran the compiled server in a directory with no `.env` and no `SECRET_KEY` in the environment — it crashed immediately with the guard's own error message, before any MySQL connection attempt; then ran it again with `SECRET_KEY` set — it proceeded normally into the (expected, in that sandbox) MySQL connection step.

**Enforced in:** `assertRequiredEnvVars()` in `src/infrastructure/config/env.ts`, called from `src/server.ts`; the now-fallback-free reads in `validate-token.ts`, `validate-admin.ts`, and `jwt-token-generator.service.ts`.

**Verified in `scripts/smoke-test.js`:** not applicable — this is a startup-time/process-level guarantee, not an HTTP-observable behavior distinguishable from "server not running at all" from outside.

---

**Last updated**: 2026-07-18
