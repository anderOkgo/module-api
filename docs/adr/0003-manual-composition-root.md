# ADR-0003: Manual composition roots, no DI framework

**Status**: Accepted (retrospective)

## Context

Every module needs its dependency graph wired somewhere: repository → use-cases/handlers → controller → router. A DI framework (InversifyJS, tsyringe, Awilix) is the conventional answer for a TypeScript hexagonal-architecture codebase this shape. `package.json` has never included one — confirmed directly (`grep`) while writing this ADR, not assumed.

## Decision

Each module exports exactly one function, `build{Module}Module()` (`infrastructure/config/{module}.module.ts`), that constructs every adapter, injects them into the application layer by hand via constructor arguments, builds the controller, wires the `Router()`, and returns `{ router, ...every constructed instance }`. No container, no decorators, no reflection-based injection. `docs/SPECIFICATION.md` §4 documents the exact shape every one of the three modules follows.

## Consequences

- Zero framework dependency, zero decorator/reflection magic, and the entire dependency graph for a module is readable top-to-bottom in one file — there's no container configuration to trace through separately from the wiring itself.
- The composition root's return value (every constructed instance, not just the router) is what lets `test/integration/`'s `buildTestApp()` reach in and replace a repository with a mock *after* the real module is built, without a parallel test-only wiring path or a container override mechanism.
- The cost scales with argument-list length: `series`' controller takes all 16 handlers as constructor arguments (see ADR-0002) — a DI container would have hidden that behind decorators. Judged acceptable at this codebase's current size; would need revisiting if a module's handler count grew enough to make the constructor itself hard to read, not before.
- No compile-time or runtime check that every dependency the graph needs is actually available — a DI container would catch a missing binding at container-build time; here, a missing constructor argument is just a TypeScript type error, no different from any other function call. In practice this hasn't been a problem: TypeScript's own type-checking already catches it.

## Alternatives considered

**Adopt a DI container** (InversifyJS or similar) once the layering discipline in ADR-0001 was in place. Rejected, implicitly — no framework was ever introduced, and the manual pattern has held across all three modules without friction serious enough to prompt revisiting it.
