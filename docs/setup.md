# Project Setup

## Requirements

- Node.js (latest LTS)
- Docker Desktop (for the local MariaDB container)
- Git
- The three sibling schema repos cloned next to this one: `animecream-data`, `auth-data`, `finan-data` — see `docker/README.md`

## Install

```bash
git clone <repository-url>
cd module-api
npm install
```

## Environment variables

There is no `.env.example` in this repo — create `.env` in the project root directly with these real variables (see `src/infrastructure/data/mysql/database.ts` and `src/infrastructure/config/env.ts`):

```env
PORT=3001
NODE_ENV=development

# Database (one Database instance per module, see docs/architecture.md)
MYHOST=localhost
MYUSER=root
MYPASSWORD=root
MYPORT=3306
MYDATABASEANIME=animecre_cake514
MYDATABASEAUTH=animecre_auth
MYDATABASEFINAN=animecre_finan

# JWT — required, no fallback. The server refuses to start without this
# (src/infrastructure/config/env.ts's assertRequiredEnvVars()).
SECRET_KEY=a-long-random-string

# Email (verification codes, admin error notifications — src/infrastructure/services/email.ts)
EMAILUSER=
EMAILERRORS=
EMAILPASSWORD=
EMAILDUMMY=
EMAILHOST=
```

There is no `JWT_EXPIRES_IN` variable — the token lifetime (30 days) is a constant in `jwt-token-generator.service.ts`, not configurable via environment.

For the smoke test's own separate credentials file (`.env.smoke.local`), see the comment at the top of `scripts/smoke-test.js`.

## Database

```bash
cd docker
docker-compose up -d --build
```

See `docker/README.md` for the real container details — what actually initializes the schema, the sibling-repo mount requirement, and the real database/table list. Don't duplicate that here.

## Run

```bash
npm run build     # tsc
npm run servers   # tsc -w + nodemon dist/index.js, for local dev
```

Production start is `node dist/index.js` after `npm run build` — there is no separate "production mode" script; `NODE_ENV` just changes a couple of response fields (see `server.ts`'s `healthCheck`/`swagger.ts`'s doc-filtering).

## Test

```bash
npm test                    # unit + integration, mocked DB
npm run test:cov            # same, with coverage (100% gated in CI)
npm run test:e2e            # opt-in, needs the real Docker MariaDB running
npm run smoke                # scripts/smoke-test.js, needs a running server instance
```

`jest.config.js` enforces **100%** statement/branch/function/line coverage — not 80%, and it's a hard CI gate (`.github/workflows/ci.yml`).

## Verify it's working

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api
```

`/health` reports `503` if the database connection is down — see `server.ts`'s `healthCheck()`.

## Deploying

See `docs/deployment.md` for the real mechanism (cPanel + FTP/SSH, not Docker/PM2/a generic CI pipeline).

---

**Last verified against source**: 2026-07-18
