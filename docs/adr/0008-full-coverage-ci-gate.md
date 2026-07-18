# ADR-0008: 100% test coverage as a hard CI gate

**Status**: Accepted — CI gate added Phase 3, 2026-07-14 (`docs/specification-roadmap.md`); threshold raised from 80% to 100% in the same phase, matching the real baseline established by the Phase 2.5 coverage-hardening pass

## Context

Phase 0's baseline audit (2026-07-14) found 951 passing / 24 failing tests and confirmed **no CI/CD pipeline existed at all** — nothing had ever gated a merge on tests passing, which is how three separate suites had drifted out of sync with real source changes (see Phase 0's root-cause table: a filename-timestamp change, a `visible`-parsing regression, and a rewritten handler with a predating test suite, none caught for weeks to months). Phase 2.5's coverage-hardening pass then found something more consequential than low coverage numbers: several files showed misleadingly high aggregate coverage only because Istanbul attributes 0/0 coverable statements to files nothing had ever exercised, mocked or real — an artifact, not a real signal (`docs/specification-roadmap.md` Phase 2.5's "Known non-issues" section, and its much larger consequence surfaced later in Phase 4a: 15 of 16 `series` handlers and 3 persistence classes had *zero* real tests, hidden behind exactly this artifact, until the integration suite loaded them unmocked for the first time).

## Decision

`.github/workflows/ci.yml` runs on every push/PR to `main`: `npm ci` → `tsc --noEmit` → `npm run test:cov:threshold`, gated at **100%** statements/branches/functions/lines (`jest.config.js`'s `coverageThreshold`, not an inline CLI flag — moved there specifically because the inline `--coverageThreshold` JSON argument silently only worked on POSIX runners, breaking under Windows' `cmd.exe` shell quoting). Any PR that adds code without full coverage now fails CI outright.

## Consequences

- This is the mechanism that would have caught the Phase 0 drift in the first place, and is the reason it's a *hard* gate (fails the build) rather than a reported metric someone has to remember to check.
- 100% coverage is a floor on "every line ran at least once under test," not a guarantee of correctness — `docs/SPECIFICATION.md` §10 and `docs/specification-roadmap.md` Phase 6/7 both name this limit directly: the coverage gate did not catch the finan username-casing bug (Phase 6), because coverage measures "was this line executed," not "was every valid input value tried." The gate is necessary, not sufficient — see ADR entries in this same directory's neighbors, and `docs/ACCEPTANCE_CRITERIA.md`, for the layer that actually catches business-rule gaps.
- Reaching and holding 100% forces a real discipline documented in `docs/SPECIFICATION.md` §10: a branch that's structurally unreachable gets *deleted*, not defended with an artificial test written just to touch it (three examples in Phase 2.5). Without that discipline, chasing 100% would incentivize exactly the kind of dead, contorted test code this project has deliberately avoided.
- The cost is real: every new line of production code requires a corresponding test before it can merge, with no "I'll add tests later" escape hatch — slower per-PR, by design.

## Alternatives considered

**A lower threshold** (the original 80%, in place before Phase 3). Explicitly raised once Phase 2.5's hardening pass showed 100% was achievable and, more importantly, that the gap between 80% and 100% was exactly where real, previously-invisible bugs and untested handlers lived — not a diminishing-returns tail worth leaving uncovered.
