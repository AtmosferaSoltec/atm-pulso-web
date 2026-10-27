# End-to-end tests

They run in a real browser against the **real API** and a real PostgreSQL, creating every record they need
through the API (no seed, no mocks). They never touch production.

## One-time setup (local)

1. Start PostgreSQL and create a throwaway database and schema, e.g.
   `createdb pulso_e2e && psql pulso_e2e -c "CREATE SCHEMA pulso"`.
2. From `../atm-pulso-api`, run the migrations against it (`DATABASE_URL=... go run ./cmd/api migrate up`).
3. Create the first superadmin **by hand**, as in production: `go run ./scripts/first-superadmin` prints the
   `INSERT`; run it in `psql`. Remember its DNI and password.
4. Start the API on a free port with that database (`scripts/dev.sh`, or `go run ./cmd/api` with `PORT`, `DATABASE_URL`,
   `JWT_ACCESS_SECRET`, `CORS_ORIGIN=http://127.0.0.1:4175` and generous `RATE_LIMIT_PER_MINUTE` /
   `LOGIN_RATE_LIMIT_PER_MINUTE`; leave `IDENTITY_API_KEY` empty so lookups answer fake data).

## Run

```sh
export E2E_SUPERADMIN_DNI=<dni> E2E_SUPERADMIN_PASSWORD=<password>
export E2E_API_URL=http://127.0.0.1:<port>/api/v1     # default http://127.0.0.1:3091/api/v1
pnpm exec playwright install chromium                  # once
pnpm test:e2e
```

Playwright starts the web on port 4175 pointing at `E2E_API_URL`.

## Notes

- Every test creates its own client with unique documents, so tests do not depend on each other and can run in parallel.
- The API has no delete endpoint, so the database accumulates test clients: use a disposable database.
- Helpers: `support/api.ts` (creates clients, staff and members through the API) and `support/ui.ts` (sign in, navigate).
