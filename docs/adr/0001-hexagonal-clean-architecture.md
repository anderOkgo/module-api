# ADR-0001: Hexagonal + Clean Architecture layering, all modules

**Status**: Accepted (retrospective — reconstructed from the Oct 2025 refactor; no live decision record from that date exists)

## Context

Before the Oct 2025 refactor (see `docs/architecture.md`'s "Design evolution" section), `auth`/`finan`/`series` had real violations of any layering discipline: use cases imported concrete `infrastructure` repository classes directly (`new XMysqlRepository()` as an optional-constructor-arg default, so a use case could construct its own dependency instead of receiving it), and repositories contained business logic that had no business being there — `user.mysql.ts` did email validation, verification-code generation, bcrypt hashing, and JWT signing, all inside what was supposed to be a pure data-access class. Testing any of that meant standing up a real database connection or fighting a constructor that quietly reached into infrastructure on its own.

## Decision

Every module is split into three layers with a fixed dependency direction:

```
infrastructure → application → domain
```

`domain/` holds entities (plain data interfaces) and ports for anything that isn't the module's own persistence (hashing, tokens, email, image processing). `application/` holds the module's own repository port and its business logic (use-cases or CQRS handlers — see ADR-0002), and may depend on `domain/` but never `infrastructure/`. `infrastructure/` holds every concrete adapter (MySQL repositories, bcrypt/JWT/SMTP/Sharp adapters, the Express controller) and is the only layer allowed to depend on both of the others. See `docs/SPECIFICATION.md` §1-§2 for the exact rule and the fixed directory shape every module follows.

## Consequences

- Every unit test can mock a port instead of standing up a real adapter — this is what makes the 100%-coverage gate (ADR-0008) actually achievable without every test suite needing a live MySQL connection.
- Business logic (hashing, token generation, email dispatch, validation) is testable in isolation from HTTP and from the database, because it never imports either directly.
- The cost: more files and more indirection than a flatter MVC-style layout for the same feature — a new CRUD-shaped endpoint needs an entity, a port, an adapter, a use case, and a controller method, minimum. Judged worth it given this codebase's stated end goal (an executable, regeneratable specification) — see the Goal section at the top of `docs/specification-roadmap.md`.
- **Not automatically enforced.** There is no lint rule or build step that fails if `application/` imports `infrastructure/` — only convention plus manual review. `docs/SPECIFICATION.md` §1 documents one real (if inert) violation found this way during a later documentation pass, not caught by anything automated.

## Alternatives considered

None recorded from the actual Oct 2025 refactor — this ADR is reconstructed after the fact. The realistic alternative, given the violation this fixed, would have been "leave repositories as the place business logic lives, just be more disciplined about it" — rejected implicitly by the refactor itself, since the whole point was that discipline alone hadn't held.
