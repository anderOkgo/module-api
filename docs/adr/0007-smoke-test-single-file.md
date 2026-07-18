# ADR-0007: `scripts/smoke-test.js` stays one plain script, not a test-framework project

**Status**: Accepted — tried the alternative for real, reverted the same day (2026-07-15; full account in `docs/specification-roadmap.md` Phase 7, "False start" section)

## Context

`docs/specification-roadmap.md` Phase 7 established that `scripts/smoke-test.js` is the one layer of this codebase's test pyramid with zero `src/` imports — plain HTTP requests to an already-running instance, portable to a from-scratch rewrite in any language, unlike `test/unit`/`test/integration`/`test/e2e` (all of which import this codebase's own TypeScript to run). That portability is the entire reason the script exists in its current form. The user asked to expand it into a genuinely exhaustive acceptance contract, starting with converting it into something more structured.

## Decision

First attempt (2026-07-15): a full rewrite into `test/acceptance/` — six TypeScript files (`helpers/client.ts`, `helpers/auth.ts`, one `*.acceptance.test.ts` per module), wired into `jest.config.js`/`package.json`, `describe.skip`-gated per credential tier. It worked — verified 36 passed/1 skipped against the real DB — but the user pushed back immediately on seeing it: the actual ask ("un JS, uno solo" — one JS file, singular) had turned into a six-file TypeScript/Jest project. **Reverted in full** the same day: deleted `test/acceptance/`, restored `jest.config.js`/`package.json` to their pre-change state, and instead added the specific new check (a username-casing regression) directly into the existing single-file `scripts/smoke-test.js`.

The decision, going forward: **this layer stays a single plain Node script with minimal dependencies (`axios`, `form-data`), never a Jest/TypeScript project, regardless of how large it grows.** New checks are added as more code inside the same file, not as new files.

## Consequences

- Splitting into a "nicer," structured multi-file project solved a problem nobody had (more organized output) at the cost of the one property that actually mattered: a single file anyone, in any language ecosystem with Node available, can open and read top to bottom without installing this project's own toolchain (TypeScript, Jest, `ts-jest`/babel config) to even run it.
- The file keeps growing linearly with every new check (872 lines as of the `series` module recovery sweep, 2026-07-18) — accepted as the cost of staying single-file, not treated as a signal to split it back out.
- **Explicit lesson recorded** (`docs/specification-roadmap.md` Phase 7): when a design goal is stated as "keep it as simple/portable as possible," resist reaching for this project's existing tooling (Jest, TypeScript) just because it's already there — that instinct is exactly what re-couples a deliberately-decoupled layer back to this codebase's own stack. This lesson is the reason this ADR exists at all, not just the reversion itself.

## Alternatives considered

**A dedicated TypeScript/Jest acceptance-test project** (`test/acceptance/`). Built, run successfully against the real database, and reverted the same day once the user clarified that structure was explicitly not wanted for this layer. Not a hypothetical rejected alternative — a real one, tried and undone.
