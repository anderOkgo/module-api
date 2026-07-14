# Executable Specification Roadmap

## Goal

Turn this codebase into a base solid enough to produce an **executable specification**: documentation precise enough that an AI (or a new developer) could regenerate the system from scratch, using the existing test suite (unit, integration, and HTTP/e2e) as the acceptance criteria that the regenerated system must pass.

Prose documentation (`docs/architecture.md`, `docs/modules/*.md`) already covers the "what exists." This roadmap covers the work needed before that prose can be trusted as a spec: a clean, fully-passing test suite, no dead code, and a CI gate to keep it that way — followed by the new spec layers themselves.

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

**Status: TODO**

- [ ] Add a GitHub Actions workflow (or equivalent) that runs `npm test` on every push/PR.
- [ ] Fail the build on any test failure — this is what should have caught the Phase 0 drift in the first place.
- [ ] Consider gating on the coverage thresholds already defined in `package.json`'s `test:cov:threshold` script (currently 80% global) — could be raised now that the real baseline is ~99-100%.

---

## Phase 4 — Executable specification layers

**Status: TODO** (blocked on Phases 1–3)

1. **`docs/SPECIFICATION.md`** — generative design rules (not descriptive): module layering invariants, CQRS conventions, port/adapter rules, entity invariants, error-handling conventions. This is the "philosophy" layer an AI needs to regenerate the system rather than copy it.
2. **Formalize HTTP/e2e tests** — turn the ad-hoc frontend-simulation scripts into a repeatable `test/e2e/` suite (supertest and/or Newman against the existing Postman collection in `docs/postman/`), run in CI.
3. **Test-pyramid audit** — confirm unit/integration/e2e tests assert behavior through public interfaces (ports, endpoints) rather than implementation details, so a regenerated system with different internals can still pass them.
4. Consider ADRs for major architectural decisions (hexagonal layering, CQRS, eventual microservice split) and, if/when the module split happens, contract testing (e.g. Pact) between `auth`/`finan`/`series`.

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
