# Executable Specification Roadmap

## Goal

Turn this codebase into a base solid enough to produce an **executable specification**: documentation precise enough that an AI (or a new developer) could regenerate the system from scratch, using the existing test suite (unit, integration, and HTTP/e2e) as the acceptance criteria that the regenerated system must pass.

Prose documentation (`docs/architecture.md`, `docs/modules/*.md`) already covers the "what exists." This roadmap covers the work needed before that prose can be trusted as a spec: a clean, fully-passing test suite, no dead code, and a CI gate to keep it that way — followed by the new spec layers themselves.

## Important: this is a multi-repo system

`module-api` is only the application-code piece. Discovered while building the E2E suite (2026-07-14): the database schema/data lifecycle is deliberately kept in **three separate sibling repositories**, in the same workspace, one per logical database:

- `animecream-data` — schema for `animecre_cake514` (the `series` module's DB)
- `auth-data` — schema for `animecre_auth`
- `finan-data` — schema for `animecre_finan`

Each follows the same convention (see `animecream-data/README.md` for the full rationale): `sql/db-structure.sql` (bootstrap-only, DROP+CREATE), `sql/db-views-procs.sql` and `sql/db-trigger.sql` (idempotent, re-run on every deploy), `sql/migrations/000N_*.sql` (incremental, idempotent, never edited after commit), and `db-deploy-schema.bat` orchestrating local test → remote deploy.

`module-api`'s own `docker/docker-compose.yml` mounted `../animecream-data/sql` and `../auth-data/sql` (and never even mounted `../finan-data/sql` at all) as MariaDB init sources — as nested subdirectories, which MariaDB's official `docker-entrypoint.sh` explicitly ignores (it only processes top-level `*.sql`/`*.sh` files, never recurses; confirmed via the container logs, which print `ignoring /docker-entrypoint-initdb.d/animecream`). This mount was never functional; the long-running local `animecream-mariadb` container's data volume is what's actually been carrying the schema for the last 9 months, not the init-script mount. **Fixed 2026-07-14** — see Phase 4c below.

**Implication for the "regenerate from scratch" goal**: a complete specification of this system has to account for all four repos, not just this one. Not in scope to fix today, but worth its own line item under Phase 4.

## Status legend

`TODO` not started · `IN PROGRESS` · `DONE` · `BLOCKED` (needs a decision)

---

## Phase 0 — Baseline audit

**Status: DONE** (2026-07-14)

Ran `npx jest --coverage` against `main` (HEAD `0ad41f7`, working tree clean). Findings:

- 951 passing / 24 failing tests, across 3 test suites (all inside the `series` module).
- No CI/CD pipeline exists (`.github/workflows` absent) — nothing has ever gated merges on tests passing, which is how the drift below went unnoticed.
- Confirmed dead code and duplicate tests (see Phase 2).

### Failing suites — root cause

| Suite | Root-cause commit | Date | What changed | Failing tests |
|---|---|---|---|---|
| `test/modules/series/infrastructure/services/image-processor.service.test.ts` | `ba5a70d` "fix: update image timestamp" | 2025-12-05 | Image filenames now include a timestamp suffix (`1_<ts>.jpg`) instead of a plain name (`1.jpg`) | 8 |
| `test/modules/series/infrastructure/controllers/series.controller.test.ts` | `9bf52f0` "fix: visible update" | 2025-12-04 | `visible` value on update changed; an extra `timestamp` field now appears in the payload passed to the handler | 2 |
| `test/modules/series/application/handlers/commands/create-series.handler.test.ts` | `886ba5f` "feat: implement series management command handlers..." | 2026-06-07 | `create-series.handler.ts` was rewritten; the entire suite (14 tests) now fails | 14 |

For each, we still need to determine whether the **source** introduced a regression (fix the code) or the **test** is stale (fix the test) — this requires product/business judgment, not just re-running things.

---

## Phase 1 — Test triage & fix

**Status: DONE** (2026-07-14)

Go through the 3 failing suites above one at a time. For each failing test: read the diff of the root-cause commit, decide correct-vs-stale, apply the fix, re-run.

| # | Suite | Decision | Resolution | Status |
|---|---|---|---|---|
| 1 | `image-processor.service.test.ts` (8 tests) | Source is correct (intentional cache-busting, documented by an inline comment) — tests were stale | Mocked `Date.now()` to a fixed value in the test and updated all filename/path assertions to include the timestamp suffix. Also translated the source's Spanish comment to English per `CLAUDE.md`. | DONE |
| 2 | `series.controller.test.ts` infra (2 tests) | Source had a genuine regression — tests were correct | Commit `9bf52f0` changed `updateSeries`'s `visible` parsing from `req.body.visible === 'true'` to `Boolean(req.body.visible)`. Since the body arrives as `multipart/form-data` (strings), `Boolean('false')` evaluates to `true` in JS — it was impossible to ever set `visible` to `false` via update. Reverted to `=== 'true'`, matching the (correct) pattern already used in `createSeries`. | DONE |
| 3 | `create-series.handler.test.ts` (14 tests) | Source is correct (intentional new business rule) — tests were stale, and the new rule had zero coverage | Commit `886ba5f` added a "demography must exist in DB" validation step (`getDemographics()` + membership check) that the test suite predates. The mock never stubbed `getDemographics()`, so it returned `undefined` and `demographics.map(...)` threw before any assertion ran. Added a default `getDemographics` mock to `beforeEach`, plus a new test covering the previously-uncovered "unknown demography_id" error path. | DONE |

Exit criteria: `npx jest` reports 0 failing tests. **Met — 976/976 tests passing, 56/56 suites, as of 2026-07-14.**

---

## Phase 2 — Dead code & duplicate test removal

**Status: DONE** (2026-07-14)

Method: for every `src/**/*.ts` file, checked whether any other file (`src` or `test`) imports it by basename (`grep -rl "from '.*<basename>'"`), excluding the two entry points (`src/index.ts`, `src/server.ts`). No path aliases are configured (`tsconfig.json` has `baseUrl`/`paths` commented out), so this catches all real import edges. Every finding was manually verified (checked for barrel re-exports, DI wiring in `*.module.ts`, and superseding implementations) before deletion.

Removed (7 source files + 4 orphaned/duplicate test files):

| File removed | Why it was dead |
|---|---|
| `src/modules/series/infrastructure/services/image.service.ts` (+ test) | Not imported anywhere; leftover from the `application/` → `infrastructure/` services move. The live one is `application/services/image.service.ts`, wired in `series.module.ts`. |
| `test/modules/series/application/series.controller.test.ts` | Duplicate of `test/modules/series/infrastructure/controllers/series.controller.test.ts` (8 tests vs. 61) — leftover from the controller's relocation to `infrastructure/`. |
| `src/modules/auth/infrastructure/persistence/user.mysql.validations.ts` | Free-function email/username/verification-code validators from before the hexagonal-architecture migration; fully superseded by methods on `user.mysql.ts` (the real `UserRepository` adapter). No importer, no test. |
| `src/infrastructure/middle.helper.ts` | Re-exported Express types/router; zero references anywhere in the repo. |
| `src/infrastructure/services/swagger-documentation.ts` | Duplicate Swagger aggregator — `src/infrastructure/services/swagger.ts` (the one `server.ts` actually uses) independently combines the same three module docs. |
| `src/modules/series/infrastructure/persistence/series.mysql.ts` (`ProductionMysqlRepository`) + `src/modules/series/application/ports/series.repository.ts` (`ProductionRepository` port, + test) | Monolithic pre-CQRS repository/port pair, fully superseded by the `series-read`/`series-write` split. The adapter had no test at all; the port's test was only propping up coverage on dead code. |

Verification after each deletion batch: `npx tsc --noEmit` (clean) and `npx jest` (all passing). Final state: **919/919 tests passing, 52/52 suites** (down from 976/56 — the difference is exactly the removed dead/duplicate tests, no coverage lost on live code).

**Correction (2026-07-14, later same day):** `src/infrastructure/services/cyfer.ts` was restored at the user's explicit request — it is not actually dead by project decision, whatever the reason (kept for future use, reference, or otherwise). Restored the file and its test from the pre-deletion commit and closed its one remaining branch gap (`dcy`'s negative-intermediate-value correction, line 27, previously untested). See Phase 2.5 table and progress log.

Not done in this pass (out of scope for a pre-spec cleanup, revisit if desired):
- No `ts-prune`/knip run for a fully automated unused-export sweep — the manual basename-grep method was sufficient for this codebase's size and caught everything checked so far.

---

## Phase 2.5 — Coverage hardening

**Status: DONE** (2026-07-14)

Goal: push unit-test coverage as close to 100% as meaningfully possible, since coverage gaps are exactly the acceptance-criteria gaps a future regeneration would silently miss. Went file by file from the lowest-covered up.

| File | Before | After | Notes |
|---|---|---|---|
| `finan.mysql.ts` | 59.68% stmts / 29.72% branch | 100% / 100% | `createTableForUser`, `findByNameAndDate`, and the ~100-line `getMonthlyBudget`/`getCurrentMonthExpenses` business logic had zero tests. |
| `series.validation.ts` | 85.13% / 81.42% | 100% / 100% | Missing: `id` as array, `production_description_en` invalid branch, genre_names all-too-long branch. |
| `image.ts` | 89.55% / 79.06% | 100% / 97.67% | Missing: aggressive-compression fallback (miscalculated in an existing test — fixed), `optimizeImageAdvanced` strategy-3 fallback and quality-step skipping, `saveOptimizedImage`/`deleteImage` catch blocks (both Error and non-Error rejections). |
| `upload.ts` | 83.33% / 80% | 100% / 100% | The real `fileFilter` (lines 7-13) was never exercised — both existing test files mock `multer` entirely. Added a new test using real `multer` + `express` + `supertest` to drive it end-to-end. |
| `mysql.helper.ts` | 80% / 100% | 100% / 100% | `generateInConditionWithOrder` and `generateOrderBy` were unused/untested exports. |
| `register.use-case.ts` | 100% / 91.66% | 100% / 100% | Missing: `first_name`/`last_name` defaulting to `''` when absent. |
| `get-initial-load.use-case.ts` | 100% / 84.21% | 100% / 100% | Fixed the reachable gap (`remainingBudget` defaulting when `monthlyBudget`/`currentMonthExpenses` are undefined) plus removed a dead defensive branch — see "Dead branches removed" below. |
| `put-movement.use-case.ts` | 95% / 94.44% | 100% / 100% | Fixed the reachable gap (missing `movement_type`) plus removed a dead defensive branch — see "Dead branches removed" below. |
| `create-series.handler.ts` | 97.5% / 95.45% | 100% / 100% | Missing: `findById` returning null after create (retrieval-failure error path), `visible` defaulting to `true` when undefined. |
| `series.controller.ts` | 100% / 90.9% | 100% / 100% | Missing: non-Error rejections in `updateSeriesImage`/`assignGenres`/`removeGenres`/`addTitles`/`removeTitles`, and the `genre_ids`/`genres`/`[]` fallback chain in `removeGenres`. |
| `my.database.helper.ts`, `validatios.helper.ts` | 0% / 0% | Dedicated tests added, still 0% in reports | See "Known non-issues" below — not a real gap. |
| `cyfer.ts` | 96.96% / 83.33% | 100% / 100% | Restored after Phase 2 (see correction note above). Missing: `dcy`'s negative-intermediate-value correction (`if (p1 < 0) p1 = p1 * -1`) — added a test that decrypts with a high-codepoint key to force `p1` negative. |

**Final state: 968/968 tests passing, 56/56 suites, 100% statements / 100% branches / 100% functions / 100% lines** (Jest's own aggregate — see note below on the 4 files it excludes from that computation).

### Dead branches removed (not tested around — deleted)

Three "uncovered branch" gaps turned out to be structurally unreachable defensive code: in each case, the *only* call site already guaranteed the condition being re-checked, so the internal guard could never see the opposite value. Rather than write a test that would have to contradict the calling code to hit them, the redundant checks were removed:

- `put-movement.use-case.ts`: `handleLinkedMovement()` is only ever called from inside `if (request.operate_for)`, so its own `if (!request.operate_for) return;` was dead. Removed (kept a `!` non-null assertion since the type is still optional).
- `get-initial-load.use-case.ts`: `validateInput()` already throws if `!data.username`, so the later `data.username?.toLowerCase().trim() ?? ''` could never take its fallback path. Simplified to `data.username!.toLowerCase().trim()`.
- `image.ts` (`optimizeImageAdvanced`): the quality-steps loop always `return`s as soon as an acceptable size is reached, so by the time execution reaches Strategy 3, `sizeKB > config.maxSizeKB` is always true. Removed the redundant `if` wrapper.

All three are behavior-preserving simplifications, verified with `tsc --noEmit` and the full test suite after each change.

### Known non-issues (coverage-tool artifacts, not test gaps)

Four files still show 0% in the per-file table, but Jest's own "All files" aggregate above already reports 100% — these files have 0 coverable statements attributed to them by Istanbul, so they're excluded from the percentage rather than dragging it down:

1. **`my.database.helper.ts`, `validatios.helper.ts`** — 3-line barrel files that only re-export bindings from `database.ts` / `generalValidation.ts` (both independently at 100%). Dedicated unmocked tests exist (`test/infrastructure/my.database.helper.test.ts`, `test/infrastructure/validatios.helper.test.ts`) and pass, exercising every line — but Istanbul/babel's coverage collector doesn't attribute the hits to these specific files, most likely because dozens of other test files `jest.mock()` these exact paths, and Jest's automocking process (which must load the real module once to learn its shape) interferes with this file's coverage entry in the merged report.
2. **`user.entity.ts`, `movement.entity.ts`** — pure TypeScript `interface`/`enum` files with no business logic. Their enums (`UserRole`, `MovementType`) are exercised by name in dozens of tests across `auth` and `finan` (including direct assertions like `expect(MovementType.INCOME).toBe(1)`), but Babel's TS-enum compilation output isn't credited by Istanbul the way regular statements are.

None of these are things a regenerated system could get wrong without a test catching it — the underlying logic is verified elsewhere in every case.

---

## Phase 2.6 — Orphaned exports sweep (`ts-prune`)

**Status: DONE** (2026-07-14), except one open item below.

The Phase 2 dead-code sweep only checked whole files (via basename grep). Ran `npx ts-prune --project tsconfig.json` to catch orphaned *exports within otherwise-used files* — genuine unused functions/types/default-exports that the file-level sweep couldn't see. Cross-checked every finding against real usage (including `HDB.generateX()` namespace-style calls, which `ts-prune` cannot see and reports as false positives) before touching anything.

**Removed (dead, zero usage anywhere):**
- `generateInConditionWithOrder` (`mysql.helper.ts`) + its test — 0 callers.
- `MovementUpdateRequest` (`movement-request.entity.ts`) + its tests — 0 callers; `PutMovementUseCase`/`UpdateMovementUseCase` both take `CreateMovementRequest`, not this type.
- `export default` on `ImageProcessor` (`image.ts`) and `swaggerSpec` (`swagger.ts`) — both already have a working named export that's what every consumer actually uses; the default was pure dead weight.
- `export default upload` (`upload.ts`) — no production consumer (`series.controller.ts` only imports `{ uploadMiddleware }`); only referenced by trivial `expect(uploadModule.default).toBeDefined()` checks in `upload.simple.test.ts`, which were removed along with it.

**Converted default → named export (kept, not deleted):**
- `Series` (`series.entity.ts`) — `ts-prune` only scans `src`, and missed that `test/modules/series/domain/entities/series.entity.test.ts` genuinely imports and exercises this as the canonical "full" domain entity type (the other exports in the same file — `SeriesCreateRequest`, `SeriesResponse`, etc. — are intentionally narrower DTOs derived from it). Not dead; just had to stop being a phantom default export nobody imported that way. Fixed the test's import to match.

**Found — NOT dead code, a missing-wiring bug (user confirmed, fixed):**
`finan.validation.ts` had three fully-implemented, fully-tested validators that `finan.controller.ts` never called: `validateInitialLoad`, `validateUpdateMovements`, `validateDeleteMovement`. Concretely, before this fix:
- `updateMovement` reused `validatePutMovement`, which never checks `id` — so route-param `id` went unvalidated.
- `deleteMovement` had **no input validation at all**.

Wired `validateUpdateMovements(req.body, id)` into `updateMovement` and `validateDeleteMovement(id)` into `deleteMovement`, reordering each method to parse `id` before validating. Updated `finan.controller.test.ts`'s mocks accordingly and added a dedicated "should return validation error for deleteMovement" test. Verified with `tsc --noEmit` and `finan.controller.ts` at 100%/100%/100%/100%.

**Still open — not yet decided:** `validateInitialLoad` remains unused. Unlike the other two, it doesn't fill a total gap — `getInitialLoad` already calls `validateGetInitialLoad` (checks only `currency`), while the unused `validateInitialLoad` additionally checks `start_date`/`end_date`/`currency` type. Two competing validators for the same endpoint; unclear which is intended to be authoritative. Needs a product decision, not just a wiring fix — flagged for the user, not yet resolved.

Verification: `tsc --noEmit` clean; full suite **963/963 tests passing, 56/56 suites, 100%/100%/100%/100%** coverage aggregate (one pre-existing, unrelated flaky test — a same-millisecond `Date.now()` collision in `create-series-complete.command.test.ts` — passes when run in isolation; not touched by this phase).

---

## Phase 3 — CI gate

**Status: DONE** (2026-07-14)

- [x] Added `.github/workflows/ci.yml` — runs on every push to `main` and every PR targeting `main`. Steps: checkout → `npm ci` → `tsc --noEmit` → `npm run test:cov:threshold` (full suite with coverage).
- [x] Fails the build on any test failure, type error, or coverage regression below 100% — this is what should have caught the Phase 0 drift in the first place.
- [x] Coverage threshold raised from 80% to **100%** (statements/branches/functions/lines), matching the real baseline established in Phases 2.5/4a. Moved from an inline `--coverageThreshold` CLI JSON argument (broken on Windows: `npm` shells out via `cmd.exe` there, which mangles single-quoted JSON — the script silently only ever worked on POSIX runners) to a proper `jest.config.js` `coverageThreshold` block, which works identically on every OS and doesn't depend on shell quoting.

Any future PR that adds code without full test coverage will now fail CI — this is the mechanism that keeps the rest of this roadmap's work from silently eroding.

---

## Phase 4 — Executable specification layers

**Status: IN PROGRESS** (items 2 and 3 done — see Phases 4a/4b/4e; item 1 and 4 remain)

1. **`docs/SPECIFICATION.md`** — generative design rules (not descriptive): module layering invariants, CQRS conventions, port/adapter rules, entity invariants, error-handling conventions. This is the "philosophy" layer an AI needs to regenerate the system rather than copy it. **TODO.**
2. **Formalize HTTP/e2e tests** — turn the ad-hoc frontend-simulation scripts into a repeatable `test/integration/` suite. **Done, see Phase 4a** — the remaining piece (Newman against a real Postman collection) is moot since `docs/postman/` doesn't actually exist in the repo (see Progress log, 2026-07-14) — would need to be created from scratch if still wanted. E2E (Phase 4b) and the operational smoke test (Phase 4e) round this out.
3. **Test-pyramid audit** — confirm unit/integration/e2e tests assert behavior through public interfaces (ports, endpoints) rather than implementation details. **Done as a side effect of Phase 4a** — see the "real coverage gap" finding below.
4. Consider ADRs for major architectural decisions (hexagonal layering, CQRS, eventual microservice split) and, if/when the module split happens, contract testing (e.g. Pact) between `auth`/`finan`/`series`. **TODO.**

---

## Phase 4a — HTTP integration tests, and the real coverage gap they exposed

**Status: DONE** (2026-07-14)

Added `test/integration/` (4 files, `build-test-app.ts`/`jwt.ts` shared helpers): real Express app, real routers, real middleware (`validateToken`/`validateAdmin` with genuine JWT verification), real controllers/use-cases/handlers — only the repository classes are mocked (`jest.mock` on `finan.mysql.ts`, `user.mysql.ts`, `series-read/write.mysql.ts`), plus `email.ts` for auth (no real SMTP calls). Covers all 3 modules end to end: auth (register with real verification-code flow, login with real bcrypt + JWT), finan (all 4 endpoints × auth/validation/success/error), series (all 16 endpoints across public/`validateToken`/`validateAdmin` tiers, including real `sharp` image processing on upload).

**The discovery:** running the integration suite alongside the unit suite dropped the aggregate coverage from 100% to ~77%. Not a regression — it revealed that **15 of 16 `series` application handlers** (every one except `create-series.handler.ts`) and **3 persistence classes** (`user.mysql.ts`, `series-read.mysql.ts`, `series-write.mysql.ts`) had **zero dedicated unit tests**. They looked like "100%" in every prior report only because they had zero coverable statements ever attributed to them (the same Istanbul "0/0 excluded" artifact documented in Phase 2.5) — nothing had ever loaded them, mocked or real, until the integration tests did. Their actual business logic (duplicate-detection, demography/genre existence checks, genre/title diffing on update, SQL query building) had never been exercised by anything.

With the user's explicit confirmation, wrote full dedicated unit test suites for all of it:

| File | Before (first touched by integration tests) | After |
|---|---|---|
| `update-series.handler.ts` | 55.93% / 38.57% | 100% / 100% |
| `create-series-complete.handler.ts` | 39.08% / 43.82% | 100% / 100% (30 tests — the most complex handler: create-vs-update branching, genre/title diffing) |
| `delete-series.handler.ts`, `assign-genres`, `remove-genres`, `add-titles`, `remove-titles`, `update-series-image` handlers | 70–77% / 60–71% | 100% / 100% each |
| `get-series-by-id`, `search-series`, `get-all-series`, `get-productions`, `get-genres`, `get-demographics`, `get-production-years` (query handlers) | 47–100% / 0–75% | 100% / 100% each |
| `user.mysql.ts` | 0% / 0% (real gap, not the barrel-file artifact) | 100% / 100% (29 tests) |
| `series-read.mysql.ts` | 0% / 0% | 100% / 100% (25 tests — including the legacy dynamic-filter `getProductions` query builder) |
| `series-write.mysql.ts` | 0% / 0% | 100% / 100% (25 tests) |

Also closed 3 smaller gaps the integration tests exposed for the same underlying reason (first real exercise of previously-"0/0" code): `validate-admin.ts` (malformed/invalid/claim-missing token paths, sync-throw path), `jwt-token-generator.service.ts` (the `verify()` method was never called by anything — only `generate()` was), `smtp-email.service.ts` (`sendWelcomeEmail`/`sendPasswordResetEmail` were never called by any use case yet — only `sendVerificationCode` is currently wired). None of these were used incorrectly, just never directly tested; the middleware/service logic was already correct.

This pass was pure test-writing — no source changes were needed to `series-*.mysql.ts` or `user.mysql.ts`; their SQL-building logic was already correct, just never verified.

**Final state: 1236/1236 tests passing, 82/82 suites, 100%/100%/100%/100% coverage — this time genuinely, with no files excluded from the aggregate by having zero coverable statements.**

Not yet committed — pending user review.

---

## Phase 4b — E2E suite against the real database

**Status: DONE** (2026-07-14)

`test/e2e/` (21 tests, opt-in via `npm run test:e2e` — excluded from the default `jest` run via `jest.config.js`'s `testPathIgnorePatterns`, since it needs a live `animecream-mariadb` container, not something CI can assume). No repository is mocked here: real MySQL connections, real stored procedures, real views, real bcrypt/JWT. Covers auth (full two-step register-with-real-verification-code flow, login against a real bcrypt hash), finan (full CRUD on a real dynamically-created per-user movements table), and series (full CRUD + genre/title relations against the real catalog). Each suite creates only distinctively-named/dedicated fixtures (`e2e<timestamp>` usernames, `__E2E_TEST_SERIES_<timestamp>__` series names) and deletes them in `afterAll` — verified zero leftovers in the real DB after a run. Real catalog data (genres, demographics) is read-only.

Found one thing only real-data E2E could ever surface: `update_rank()` (called after every series create/update) rewrites `qualification` for **every row in `productions`**, interpolating it between 7.0–9.7 based on rank position across the whole catalog — it does not persist the submitted value verbatim. A mocked test would never reveal this; the first E2E run caught it immediately (a test asserting the literal submitted value failed with a real re-ranked number back). Fixed the test to assert range + DB/response consistency instead of an exact value — this is correct, intentional application behavior, not a bug.

Also surfaced, while investigating where the schema actually lives: the whole database schema/data lifecycle turns out to live in three separate sibling repositories (`animecream-data`, `auth-data`, `finan-data`) — see "Important: this is a multi-repo system" at the top of this document.

---

## Phase 4c — Fixed the `docker-compose.yml` init-script bug, wired two smaller findings

**Status: DONE** (2026-07-14)

**`finan.validation.ts`'s `validateInitialLoad`** (the open question from Phase 2.6): merged into `validateGetInitialLoad` rather than wiring it in separately — the two checked non-overlapping things (currency format vs. start/end-date validity), so `getInitialLoad` now validates all three in one pass, and the now-fully-redundant `validateInitialLoad` function was deleted. `finan.controller.ts` needed no changes (it already called `validateGetInitialLoad`). 100%/100% maintained; net -1 test (one 6-test `describe` block removed, 5 new date-validation cases added to the surviving function's block).

**The `docker-compose.yml` init bug**: fixed by adding `docker/sql/00-run-nested-init-scripts.sh` — a top-level script (which MariaDB's entrypoint *does* process) that manually applies each sibling repo's `db-structure.sql` → `db-views-procs.sql` → `db-trigger.sql` (in that order; skips `db-data.sql` — real data shouldn't auto-load into a fresh CI/dev DB — and `db-swap.sql`, a generated artifact for the separate migration-deploy pipeline). Also added the previously-missing `../finan-data/sql` mount to `docker-compose.yml` (finan's schema wasn't mounted *at all* before). Two things had to be worked out empirically, not guessed:
- The installed MariaDB version's (10.3.39, per `docker/Dockerfile`) entrypoint doesn't expose a `docker_process_sql` helper to sourced scripts (that's a newer-image convention) — the script calls `mysql -uroot -p"$MYSQL_ROOT_PASSWORD"` directly instead, which is portable across versions.
- `db-structure.sql` contains `CREATE DATABASE IF NOT EXISTS <name>` but no `USE <name>` before its `DROP TABLE`/`CREATE TABLE` statements, and `mysql <db> < file.sql` requires the target database to already exist at connection time — so the script creates the database in a separate, database-less `mysql -e` call before piping the file in with the database name as an argument.
- Windows/Docker Desktop refused to mount a host directory onto a nested container path (`/docker-entrypoint-initdb.d/animecream`) that didn't already exist inside the parent bind-mounted directory (`error mounting ... file exists`) — fixed by committing empty `docker/sql/{animecream,auth,finan}/.gitkeep` placeholders so the mount points pre-exist.

Verified for real: built the actual image (`docker build -f docker/Dockerfile docker`), ran a brand-new container (fresh named volume, real sibling-repo mounts, none of the 9-months-persistent state) end to end, and diffed its resulting tables/views/procedures against the long-running `animecream-mariadb` container — identical across all three databases. Cleaned up the throwaway image/container afterward.

Also added `.gitattributes` (`*.sh text eol=lf`) — without it, Windows' `core.autocrlf` would silently convert the new shell script to CRLF on checkout, which breaks its shebang inside the Linux container.

---

## Phase 4d — `src/server.ts` coverage (0% → 100%)

**Status: DONE** (2026-07-14)

The last never-tested file. Its constructor has real bootstrap side effects (opens a live DB connection, calls `process.exit(1)` on failure, binds a real port via `app.listen()`) that make it fundamentally un-unit-testable as originally written — nothing could construct `Server` without those side effects firing.

**Refactored, behavior-preserving:** extracted `buildApp(database)`, `errorHandlerMiddleware`, and `healthCheck` as named exports — pure app-assembly logic (middleware, routes, error handling) with zero side effects, parameterized on `Database` instead of reading `this`. `Server`'s constructor now calls `buildApp()` internally and still does the real bootstrap (`connectDB()` + `listening()`) exactly as before; `src/index.ts` (`new Server()`) is unaffected.

Two real findings surfaced while doing this, both fixed:
- **`errorHandlerMiddleware`'s `'Not Found'` / `'Method Not Allowed'` branches were dead code** — confirmed nothing anywhere in the codebase ever throws `new Error('Not Found')` or `new Error('Method Not Allowed')`. The comment `// Removed default routes - using direct endpoint` explains why: a catch-all route that used to throw those errors was removed at some point, orphaning the handler branches. Removed them.
- **The real server had no actual 404 handling** — with the throwing catch-all gone, an unknown route just fell through to Express's default HTML 404, never reaching `errorHandlerMiddleware` at all. Added a real `app.use((req, res) => res.status(404).json({ error: 'Not Found' }))` catch-all before the error handler — this is also what finally makes `test/integration/helpers/build-test-app.ts`'s JSON-404 assumption (invented for those tests, back in Phase 4a, before this fix existed) actually match production.

`test/server.test.ts` (17 tests): `buildApp()` tested via supertest with a mocked `Database` and mocked per-module routers (health up/down, root's keep-alive ping success/failure incl. non-Error rejections, `/api`, `/api-docs`, sub-router mounting, the new 404, malformed-JSON 400); `errorHandlerMiddleware` and `healthCheck` tested directly as functions for their remaining branches; `Server`'s own bootstrap tested with `Database` mocked (successful connect+listen, `process.exit(1)` on connection failure, and the `PORT` env fallback — verified by intercepting `express.application.listen` at the prototype level so no real port is ever bound, even for that last test).

Also closed a coverage gap this incidentally exposed in `swagger.ts` (same "nothing ever imported it unmocked" story as Phase 4a): `filterUserDocumentation`'s production-only branch (hides the registration endpoint from the public docs) had never been exercised. `test/infrastructure/services/swagger.test.ts` freshly `require()`s the module under both `NODE_ENV` values to hit both branches (the filtering happens once, eagerly, at module-load time).

**Final state: 1254/1254 tests passing, 84/84 suites (+21 E2E, unaffected), 100%/100%/100%/100% coverage.**

---

## Phase 4e — Standalone HTTP smoke-test script

**Status: DONE** (2026-07-14)

The last item of the CI-gate → E2E-suite → smoke-test plan (user-chosen order, Phase 3's progress-log entry). Unlike `test/e2e/`, this isn't a Jest suite run against a disposable/CI-provisioned instance — it's `scripts/smoke-test.js`, a standalone Node/axios script meant to be pointed at any *already-running* instance (local dev, staging, or production) after a deploy, to confirm the API actually works before trusting the deploy.

**First cut vs. final version:** the first version only touched 16 read-only/negative-path endpoints and skipped every mutating one. The user explicitly pushed back on this ("yo quería que se probaran todos los endpoints absolutamente todos") and offered real credentials, so the script was rewritten to exercise **every one of the 21 real API routes** (4 app-level + 15 series + 2 auth + 4 finan... counted individually the series module alone is 15 routes across public/user/admin tiers), not just a subset — see the full checklist below.

Design constraints, all deliberate:
- **Safe by default with no credentials.** Every check that runs with no login supplied is either read-only against public data or a negative-path check (missing/invalid auth, bad login, malformed email) that can never create or mutate a real row.
- **Real login, not a pre-minted token, is the default credential path.** `SMOKE_ADMIN_LOGIN`/`SMOKE_ADMIN_PASSWORD` and `SMOKE_USER_LOGIN`/`SMOKE_USER_PASSWORD` env vars make the script call the real `POST /api/users/login` itself (so login success is also genuinely tested, not assumed) rather than requiring the operator to hand-generate a JWT. `SMOKE_ADMIN_TOKEN`/`SMOKE_USER_TOKEN` remain supported as a fallback for when sending a real password over the wire isn't wanted (e.g. against production). If only an admin login is supplied, its token is reused for the user-tier checks too, since `validateToken` only requires a valid token, not a specific role — the user's own call, since they pointed the same account at both fields.
- **Credentials never touch the conversation or CLI.** They're read from environment variables, auto-loaded from a gitignored `.env.smoke.local` file the operator edits directly — never a positional CLI argument (which would leak into shell history and process listings) and never typed into chat.
- **Mutating checks use disposable, distinctively-named fixtures and clean up after themselves**, the same pattern `test/e2e/` uses: `__SMOKE_TEST_SERIES_<ts>__` / `__SMOKE_TEST_COMPLETE_<ts>__` for series, `SMOKE_TEST_MOVEMENT_<ts>` for finan movements, tagged `smoke-test`.
- **`validateStatus: () => true`** on the shared axios client — every check asserts on the actual status code itself rather than relying on axios's throw-on-4xx/5xx behavior.
- **Exit code 0/1** based on whether every check passed — usable directly as a deploy-pipeline gate.

**Full endpoint checklist (35 checks when both admin and user credentials are supplied):**
- App-level (4): `/`, `/health`, `/api`, `/api-docs`, plus an unknown-route 404 check.
- Series public (6): boot `POST /`, `GET /years`, `GET /genres`, `GET /demographics`, `POST /search`, `GET /:id` (404 case).
- Auth gates, unauthenticated (3): `GET /list`, `POST /create`, `POST /finan/initial-load` all correctly reject with 401.
- Auth negative (2): bad login, invalid-email registration attempt.
- Auth real login (1 or 2): real `POST /login` success for the supplied account(s).
- Series authenticated (1): `GET /list` with a valid token.
- Finan full CRUD (4): `POST /insert` → `POST /initial-load` (confirms the row appears) → `PUT /update/:id` → `DELETE /delete/:id` (a real hard delete, confirmed against the DB).
- Series admin full CRUD (11): `POST /create` (real multipart image upload via the real `sharp` pipeline) → `GET /:id` → `PUT /:id` → `PUT /:id/image` (second real image upload) → `POST /:id/genres` (invalid-id rejection, then real assignment) → `DELETE /:id/genres` → `POST /:id/titles` → `GET /:id` (confirms genres+titles reflected) → `DELETE /:id/titles` → `DELETE /:id` (soft delete).
- Series admin create-complete (2): `POST /create-complete` (the JSON-body, one-shot create-with-genres-and-titles path) → `DELETE /:id` cleanup.

**One real, permanent limitation, documented in-script:** `DELETE /api/series/:id` is a soft delete (`visible = 0`) — the HTTP API exposes no hard-delete endpoint, so disposable series fixtures remain as invisible rows in `productions` forever (unlike finan movements, which really are removed). Acceptable for a local/disposable DB; worth knowing before pointing this at production repeatedly. Also, **registration success is still not smoke-testable**: `POST /api/users/add`'s second step requires a verification code delivered by a real SMTP send, which this script has no way to receive — only `test/e2e/auth.e2e.test.ts` (mocked email transport) exercises that path for real.

Verified for real, twice: the first (16-check, no-mutation) version was manually verified against a live local server, including a deliberately-broken-connection run that surfaced and fixed an empty-`error.message`-on-`ECONNREFUSED` bug (`describeError()` fallback: `error.message || error.code || String(error)`). The expanded (35-check, full-CRUD) version was then run for real against the local Docker MariaDB copy using the project owner's real admin account (`SMOKE_ADMIN_LOGIN`/`SMOKE_ADMIN_PASSWORD` in `.env.smoke.local`, gitignored) — **35/35 passed** on the first attempt. Cleanup was independently confirmed by querying the database directly afterward: the finan movement fixture was gone entirely; the two series fixtures existed only as `visible = 0` rows, exactly as designed.

Added `npm run smoke` (`node scripts/smoke-test.js`) as the shortcut, matching the `test:e2e` pattern. Added `form-data` as an explicit dependency (was previously only a transitive one via `axios`) since the script now builds real multipart requests for the image-upload endpoints. Not a Jest suite, so it's not part of `jest.config.js`'s `testPathIgnorePatterns` bookkeeping and isn't counted in the test-suite totals below — it's an operational tool, not part of the acceptance-criteria test pyramid.

This closes out Phase 4's HTTP/e2e-simulation item in full: unit → integration → E2E → operational smoke test that genuinely exercises every endpoint, one layer per phase.

---

## Phase 5 — Cross-repo SQL/transaction hardening

**Status: DONE** (2026-07-15)

Triggered by a fresh review of how `series` (animecream) and `finan` writes work end to end, requested directly against `animecream-data/sql/db-views-procs.sql` and `finan-data/sql/db-views-procs.sql`. Six concrete issues found; user ruled out one option (consolidating `finan`'s per-user tables into one shared table) and confirmed one piece of behavior as intentional (see item 6) before this phase started. **Hard constraint for all of it, stated explicitly by the user: 100% backward compatibility — the full test suite and the standalone smoke-test script (`npm run smoke`, Phase 4e) must both stay at 100%, with zero behavior surprises outside what's listed here.**

| # | Item | Repo | Status |
|---|---|---|---|
| 1 | `get-initial-load.use-case.ts:23` missing `await` on `createTableForUser()` — race condition on a brand-new user's first request | `module-api` | DONE |
| 2 | 9 finan stored procedures build dynamic SQL by concatenating parameter values directly into quoted literals (`... currency = ''', p_currency, ''' ...`) before `PREPARE`/`EXECUTE` — real SQL-injection surface via `currency` (only length-3-checked, no charset check). Fixed: values bound via `EXECUTE ... USING` instead of string interpolation; only the per-user table name stays dynamic (by design, user kept the per-user-table architecture); added a username-format guard (`REGEXP '^[a-z0-9_]+$'`, `SIGNAL SQLSTATE '45000'`) as defense in depth | `finan-data` | DONE |
| 3 | `Database` class (`src/infrastructure/data/mysql/database.ts`) had no transaction support at all — only single-statement `pool.query` | `module-api` | DONE |
| 4 | `series-write.mysql.ts`'s `assignGenres` did `DELETE` then `INSERT` as two independent statements — a failed insert after the delete left a series with zero genres, no rollback. `create-series-complete.handler.ts` orchestrated multiple writes with a comment claiming "transactional manner" but no actual transaction. Fixed: added `runInTransaction` to `SeriesWriteRepository`, made `assignGenres` atomic, wrapped the multi-step handlers (`create-series-complete`, `update-series`, `create-series`'s create/update+updateRank — `updateImage` deliberately stays outside, non-fatal by design) | `module-api` | DONE |
| 5 | `UpdateImangeTr` trigger (`BEFORE INSERT ON productions`) computed `image` from a racy `SELECT MAX(id)+1` and silently overwrote the app's own explicit `image=''` default; the app already manages `image` correctly post-insert via the real auto-increment id. Removed | `animecream-data` | DONE |
| 6 | `update_rank()` used a row-by-row cursor instead of a set-based `UPDATE`. **User confirmed the qualification-rescale itself (7.000–9.700 interpolation) is intentional** — it keeps decimal spacing between series so new ones can always be inserted in between later; not vestigial. Rewritten as a `ROW_NUMBER()`-based `UPDATE` (same pattern already used by this file's own `v_avg_top10_by_year` etc.) | `animecream-data` | DONE |

### Verification (all against the real, long-running `animecream-mariadb` Docker container — not mocked)

- **Item 2 (finan SQL injection):** applied the rewritten `db-views-procs.sql` to `animecre_finan`, no syntax errors under the container's strict `sql_mode`. Called `proc_view_total_balance` with a `currency` value containing `'; DROP TABLE ...; --` (crafted to fit the 3-char length check any client-side validation would apply) — the bind-parameter version rejects it as `Data too long for column 'p_currency'` (i.e. it's treated as literal string data, never reaches the SQL text), the fixture table and its row survive untouched, and a legitimate call (`'USD'`) still returns the correct balance.
- **Item 6 (`update_rank` rewrite):** against the real `productions` table (511 rows): snapshotted `qualification`, ran the **old cursor proc**, snapshotted `(id, rank, qualification)` as "expected"; restored the original `qualification` values; applied the **new set-based proc**; ran it; snapshotted again — **byte-identical diff** against "expected". Also verified the 0-row and 1-row edge cases against a scratch table under the same strict `sql_mode` (no division-by-zero).
- **Item 5 (trigger removal):** applied the updated `db-trigger.sql`; `SHOW TRIGGERS` on `productions` now returns empty.
- **Item 4 (real atomic rollback):** new E2E test (`test/e2e/series.e2e.test.ts`) creates a real series, assigns one real genre, then calls `assignGenres` again with a genre id that violates the real `productions_genres.genre_id` FK constraint — confirms the DELETE-then-failed-INSERT no longer leaves the series with zero genres (the original assignment survives).
- **Item 2's design goal (per-user table isolation, kept by explicit user choice):** new E2E test (`test/e2e/finan.e2e.test.ts`) creates two distinct users, inserts a movement for each, and confirms each lands only in their own `movements_<user>` table with zero cross-contamination — the actual business invariant the table-per-user schema exists to guarantee, now covered as an executable acceptance check rather than just a design intention on record. (Answered a scope question about *where* this kind of check belongs: not the smoke test, which only exercises one already-authenticated account against an already-deployed instance — the E2E suite is the right home since it seeds real, disposable, multi-fixture scenarios against the real DB.)
- **Full backward-compatibility gate:** `tsc --noEmit` clean · `npm run test:cov:threshold` **1266/1266 tests, 84/84 suites, 100%/100%/100%/100% coverage** (mechanical fallout from adding the required `runInTransaction` interface member fixed across all 12 affected test files, per the plan) · `npm run test:e2e` **25/25 passing** against the real DB (23 pre-existing + 2 new above) · `npm run smoke` **35/35 passing** against a real locally-built server + the same real DB.

Full plan (file paths, exact diffs, chosen designs, and the verification checklist) was written to a plan file during this session and executed item by item, in the order listed above.

---

## Progress log

- **2026-07-14** — Phase 0 complete. Findings documented above. Starting Phase 1 (test-by-test triage) next.
- **2026-07-14** — Phase 1 item 1 done: `image-processor.service.test.ts` fixed (8 tests). Root cause was stale tests, not a source bug. 24 → 16 failing tests remaining.
- **2026-07-14** — Phase 1 item 2 done: `series.controller.test.ts` fixed (2 tests). Root cause was a real regression in `src` (`Boolean('false') === true` bug from commit `9bf52f0`), now reverted. 16 → 14 failing tests remaining.
- **2026-07-14** — Phase 1 item 3 done: `create-series.handler.test.ts` fixed (14 tests) and one new test added for a previously-uncovered error path. **Phase 1 complete: 976/976 tests passing, 56/56 suites.** Starting Phase 2 (dead code removal) next.
- **2026-07-14** — Phase 2 complete: removed 7 dead source files and 4 orphaned/duplicate test files across `series`, `auth`, and shared `infrastructure` (see table above). `tsc --noEmit` clean, **919/919 tests passing, 52/52 suites**. Starting Phase 3 (CI gate) next.
- **2026-07-14** — Phases 1 and 2 committed (`6d0a9e5` "fix: repair source/test drift and remove dead code found in spec-readiness audit"). Noted while assessing deploy safety: `docs/README.md` links to `docs/postman/`, but that directory does not exist in the repo — stale documentation reference, worth fixing in a later docs pass.
- **2026-07-14** — Phase 2.5 (coverage hardening) complete. Went from 91.42%/85.23% (stmts/branch) to 99.89%/99.52%, project-wide. 965/965 tests passing, 55/55 suites. Not yet committed — pending user review. Starting Phase 3 (CI gate) next.
- **2026-07-14** — Restored `src/infrastructure/services/cyfer.ts` (+ test) at the user's request; it was incorrectly removed as dead code in Phase 2. Closed its one remaining coverage gap. 968/968 tests passing, 56/56 suites.
- **2026-07-14** — Removed the 3 dead defensive branches (`put-movement.use-case.ts`, `get-initial-load.use-case.ts`, `image.ts`) instead of leaving them as documented non-issues. **Coverage is now genuinely 100%/100%/100%/100% per Jest's own aggregate.** Not yet committed — pending user review.
- **2026-07-14** — Phase 2.6 (`ts-prune` orphaned-export sweep) done. Removed 4 genuinely dead exports (+ tests), converted 1 phantom default export to a named one it actually needed, and — with user confirmation — fixed a real bug: `updateMovement`/`deleteMovement` were never validating their `id` route param because the correct validators existed but were never wired into `finan.controller.ts`. One open question left for the user: `validateInitialLoad` is a second, stricter, unused validator competing with the one `getInitialLoad` already uses — needs a product call, not just a wiring fix. 963/963 tests passing, 56/56 suites, 100% coverage aggregate. Not yet committed.
- **2026-07-14** — Phase 4a done: added `test/integration/` (60 tests across auth/finan/series/app-level), which exposed that 15/16 series handlers and 3 persistence classes had zero real unit tests (hidden by the "0/0 excluded" coverage artifact). Wrote full unit test suites for all of it plus 3 smaller infra services. **1236/1236 tests passing, 82/82 suites, coverage is genuinely 100%/100%/100%/100%.** Not yet committed — pending user review.
- **2026-07-14** — Both prior commits (`4261619` integration tests, and the coverage-hardening one before it) confirmed pushed to `origin/main`.
- **2026-07-14** — Phase 3 (CI gate) done: `.github/workflows/ci.yml` runs type-check + full test suite with a 100% coverage gate on every push/PR to `main`. Fixed a latent cross-platform bug in `test:cov:threshold` along the way (inline `--coverageThreshold` JSON in the npm script broke under Windows' `cmd.exe` shell; moved the threshold into `jest.config.js`). Verified locally: `tsc --noEmit` clean, `npm run test:cov:threshold` exits 0. Not yet committed — pending user review. Next up (user chose this order): E2E suite against the Docker MariaDB instance, then a standalone HTTP smoke-test script.
- **2026-07-14** — CI gate commit (`8c7a850`) pushed. Started the E2E suite: discovered `animecream-mariadb`'s data volume (running for 9 months) has real data (`movements_anderokgo`/`movements_mariaz` are the author's actual finance tracking), so briefly explored dumping a structure-only schema into `module-api` before the user pointed out the real source of truth — the three sibling `*-data` repos (see "Important: this is a multi-repo system" above). Reverted the dump attempt (would have created a second, divergent schema source). User confirmed it's fine to write to this DB directly (it's a copy). Proceeding to build the E2E suite against the live container, using dedicated/distinctively-named test fixtures rather than touching `anderokgo`/`mariaz`/real series data.
- **2026-07-14** — Phase 4b done: `test/e2e/` (21 tests) passing against the real database, zero fixture leftovers verified. Along the way, real E2E surfaced genuine application behavior no mock could ever show (`update_rank()` rewriting `qualification` catalog-wide) — fixed the test's assertion, not the app (it's correct, intentional behavior).
- **2026-07-14** — Phase 4c done, closing two items the user asked for directly: merged `validateInitialLoad` into `validateGetInitialLoad` (Phase 2.6's open question) and fixed the `docker-compose.yml` nested-init-script bug for real, verified against a from-scratch container build+run, not just reasoned about. Full suite still 100%/100%/100%/100% (1235 tests, one net fewer than before due to the validator merge). Not yet committed — pending user review.
- **2026-07-14** — Phase 4d done: `server.ts` (the last 0%-coverage file, unreachable by tests as originally written since its constructor has real bootstrap side effects) refactored to separate pure app-assembly from bootstrap, then fully tested. Found and fixed two real things along the way: dead 404/405 branches in the error handler, and the real server never actually sent a JSON 404 for unknown routes at all. Also closed a `swagger.ts` gap the same investigation exposed (production doc-filtering branch never exercised). **1254/1254 tests passing, 84/84 suites, 100%/100%/100%/100% coverage.** Not yet committed — pending user review.
- **2026-07-14** — Phase 4e done (first cut): `scripts/smoke-test.js` (standalone HTTP smoke test, safe-by-default with opt-in authenticated checks) written and manually verified against a real running server + real Docker MariaDB — happy path, authenticated/admin paths, and the failure-reporting path (fixed an empty-error-message bug for connection-level failures along the way). Added `npm run smoke`.
- **2026-07-14** — User pushed back: the first cut only covered 16 read-only/negative-path checks, not every endpoint, and offered real credentials to close the gap. Rewrote the script to log in for real (`SMOKE_ADMIN_LOGIN`/`PASSWORD`, `SMOKE_USER_LOGIN`/`PASSWORD`, auto-loaded from a new gitignored `.env.smoke.local`) and exercise the full CRUD cycle on every mutating endpoint (series create/update/image-upload/genres/titles/create-complete/delete, finan insert/update/delete) using disposable fixtures cleaned up afterward, mirroring `test/e2e/`'s pattern. Ran it for real against the local DB with the project owner's own admin account: **35/35 checks passed** on the first attempt; cleanup independently confirmed via direct DB queries (finan fixture hard-deleted, series fixtures left only as `visible=0` rows — the HTTP API has no hard-delete for series). Added `form-data` as an explicit dependency for the real multipart image-upload checks. This closes out the CI-gate → E2E-suite → smoke-test plan in full, this time genuinely covering every endpoint. Not yet committed — pending user review.
- **2026-07-15** — Started Phase 5, prompted by a direct request to review how `series`/`finan` writes work and the SQL in `animecream-data`/`finan-data`. Found the 6 items in the table above. User ruled out consolidating finan's per-user tables into one shared table (keeping `movements_<username>` by design) and, after investigation turned up no documented intent anywhere (not in commits, docs, or the frontend, which never displays `qualification` to end users), confirmed directly that `update_rank`'s qualification-rescale is intentional — it reserves decimal spacing so new series can always be inserted between existing ones later, not vestigial. User set a hard requirement: 100% backward compatibility, full test suite + smoke test must both stay green. Plan approved; starting implementation in item order (1 → 6).
- **2026-07-15** — Phase 5 done, all 6 items implemented and verified for real (details and exact numbers in the Phase 5 section above, not repeated here). Along the way, the user asked directly where a "two users, two tables, isolation" acceptance check belongs — answered that it's the E2E suite, not the smoke test (which only drives one already-authenticated account against an already-deployed instance), and added it there as a real, disposable-fixture test against the live DB, alongside a second new E2E test proving `assignGenres`'s delete+insert is now genuinely atomic under a real FK failure. Verified end to end: `tsc --noEmit` clean, **1266/1266 tests / 84/84 suites / 100% coverage**, **25/25 E2E** (23 pre-existing + 2 new) against the real `animecream-mariadb` container, **35/35 smoke checks** against a real locally-built server. Not yet committed — pending user review.
