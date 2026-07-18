# Auth Module (`src/modules/auth/`)

Handles user registration, login, and admin-driven password reset. JWT-based, stateless authentication.

## Structure

```
auth/
├── domain/
│   ├── entities/
│   │   ├── user.entity.ts          # User, UserRole (ADMIN=1, USER=2, GUEST=3), UserCreateRequest, UserResponse, LoginResponse
│   │   └── login.entity.ts         # Login (email/username + password)
│   └── ports/
│       ├── password-hasher.port.ts # hash(), compare()
│       └── token-generator.port.ts # generate(), verify(), getExpiresInSeconds()
├── application/
│   ├── ports/
│   │   ├── user.repository.ts      # UserRepository - full CRUD + auth-specific methods
│   │   └── email.service.port.ts   # sendVerificationCode/sendWelcomeEmail/sendPasswordResetEmail
│   └── use-cases/
│       ├── register.use-case.ts
│       ├── login.use-case.ts
│       └── admin-reset-password.use-case.ts
└── infrastructure/
    ├── persistence/
    │   └── user.mysql.ts            # UserRepository adapter, DB: MYDATABASEAUTH
    ├── services/
    │   ├── bcrypt-password-hasher.service.ts  # SALT_ROUNDS = 10
    │   ├── jwt-token-generator.service.ts     # EXPIRES_IN_DAYS = 30 (single source of truth)
    │   └── smtp-email.service.ts
    ├── controllers/
    │   └── user.controller.ts
    ├── config/
    │   └── auth.module.ts            # Composition Root
    └── documentation/
        └── user.swagger.ts
```

`validateToken` / `validateAdmin` (JWT verification middleware) and the `SECRET_KEY` startup guard live outside this module, in `src/infrastructure/services/` and `src/infrastructure/config/env.ts` respectively — they're shared across all three modules.

## Endpoints

| Method & Path | Auth | Use case |
|---|---|---|
| `POST /api/users/add` | none | `RegisterUserUseCase` |
| `POST /api/users/login` | none | `LoginUserUseCase` |
| `PUT /api/users/admin/reset-password` | `validateAdmin` | `AdminResetPasswordUseCase` |

## Registration flow

Two-step (email verification), driven by whether `verificationCode` is present in the request body:

1. **No code**: validates email format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), username format (`/^[a-zA-Z0-9_]{3,20}$/` — uppercase letters allowed, see the case-sensitivity note below), password length (**≥ 6 characters, no complexity rules** — no uppercase/symbol/number requirement despite what older docs claimed), and email/username uniqueness. Generates a 6-digit code, saves it, emails it, returns `{ error: false, message: 'Verification code sent' }` without creating the user yet.
2. **With code**: re-validates the same fields, checks the code, hashes the password (bcrypt, 10 rounds), creates the user with `role: UserRole.USER` — **registration can never create an admin account** (`docs/ACCEPTANCE_CRITERIA.md` #15); every admin account is provisioned directly in the database.

## Login flow

`LoginUserUseCase.execute()`:

1. Resolves `email ?? username` as the identifier; if both are supplied and belong to different accounts, `findByEmailOrUsername()` tries **username first** (Catalog #14).
2. Rejects inactive or currently-locked accounts.
3. Compares password via bcrypt.
4. On failure: increments `login_attempts`, and locks the account for **15 minutes** once the pre-increment count is already `>= 4` — i.e. the account locks on the **5th** consecutive failure, not the 4th (Catalog #13). No auto-expiry sweep; only the next successful login clears it.
5. On success: resets attempts, updates `last_login`, issues a JWT good for **30 days** (`JwtTokenGeneratorService.EXPIRES_IN_DAYS`), and returns `expiresIn` in seconds derived from that same constant — this used to be a hardcoded, wrong `86400` (24h), fixed in Catalog #12.

## Admin password reset

`PUT /api/users/admin/reset-password` — added specifically because `UserRepository.update/delete/unlockUser` were already fully implemented but unreachable from any endpoint (Catalog #16). Takes `{ identifier, newPassword }`, no current-password check (authorization is `validateAdmin`'s job), and also clears any existing lockout so the account is immediately usable (Catalog #17).

## Security

- **Passwords**: bcrypt, 10 salt rounds (`BcryptPasswordHasherService`).
- **JWT**: signed/verified with `process.env.SECRET_KEY` — **no fallback**. `src/infrastructure/config/env.ts`'s `assertRequiredEnvVars()` crashes the process at startup if `SECRET_KEY` is missing, rather than ever degrading to a guessable default (Catalog #18 — this used to be two different hardcoded literals for signing vs. verifying).
- **Account lockout**: see Login flow above.
- **Username casing**: allowed at registration, never normalized in `auth` itself — but `finan`'s per-user table naming depends on this being handled consistently there (see `docs/modules/finan.md` and Catalog #3).

## Testing

Real, current coverage — no fictional test list. See:
- `test/modules/auth/**/*.test.ts` — unit tests per use case/service (100% coverage).
- `test/integration/auth.integration.test.ts` — real Express app + real JWT, mocked repository.
- `test/e2e/auth.e2e.test.ts` — real two-step registration (real verification code via a mocked SMTP transport), real login, real admin password reset, against the live database.

## Known gaps (real, not aspirational)

- No self-service password reset — only the admin-driven one above.
- No 2FA, no refresh tokens, no rate limiting by IP.
- `UserRepository.update()` and `unlockUser()` are implemented and tested at the persistence layer but still have no caller anywhere (Catalog #16) — `delete()` is the same.

For the full, continuously-updated list of non-obvious business rules in this module (with exact enforcement points and smoke-test verification status), see **`docs/ACCEPTANCE_CRITERIA.md`**, entries #3, #12–#18.

---

**Last verified against source**: 2026-07-18
