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
| `src/infrastructure/services/cyfer.ts` (+ test) | Legacy hand-rolled cipher, superseded by bcrypt (`bcrypt-password-hasher.service.ts`) + JWT (`jwt-token-generator.service.ts`). Had its own test but zero production wiring. |
| `src/infrastructure/services/swagger-documentation.ts` | Duplicate Swagger aggregator — `src/infrastructure/services/swagger.ts` (the one `server.ts` actually uses) independently combines the same three module docs. |
| `src/modules/series/infrastructure/persistence/series.mysql.ts` (`ProductionMysqlRepository`) + `src/modules/series/application/ports/series.repository.ts` (`ProductionRepository` port, + test) | Monolithic pre-CQRS repository/port pair, fully superseded by the `series-read`/`series-write` split. The adapter had no test at all; the port's test was only propping up coverage on dead code. |

Verification after each deletion batch: `npx tsc --noEmit` (clean) and `npx jest` (all passing). Final state: **919/919 tests passing, 52/52 suites** (down from 976/56 — the difference is exactly the removed dead/duplicate tests, no coverage lost on live code).

Not done in this pass (out of scope for a pre-spec cleanup, revisit if desired):
- No `ts-prune`/knip run for a fully automated unused-export sweep — the manual basename-grep method was sufficient for this codebase's size and caught everything checked so far.

---

## Phase 3 — CI gate

**Status: TODO**

- [ ] Add a GitHub Actions workflow (or equivalent) that runs `npm test` on every push/PR.
- [ ] Fail the build on any test failure — this is what should have caught the Phase 0 drift in the first place.

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
