# WEB-01: foundation, login, profile, lookups

**Needs:** API-01 (done). **Read first:** `docs/README.md`, `docs/api-integration.md`, `src/features/auth`, `src/store`, `tests/*.spec.ts`.

## Build

1. Dependencies, `api:types` script, `VITE_API_URL`, `apiClient`, `QueryClientProvider`, auth store (see api-integration.md).
2. **Login page**: DNI + password against `POST /auth/login`. Keep the current design. Remove the demo account buttons/list. Map errors:
   `INVALID_CREDENTIALS` to "DNI o contraseña incorrectos", `TOO_MANY_ATTEMPTS`/429 to "Demasiados intentos. Espera unos minutos.", network to "No se pudo conectar".
3. **Session**: after login call `GET /me`; keep `{token, user}` in memory; logout clears it; a `401` anywhere returns to login. Routes guard on `user`.
4. **Profile** (all roles): show name, DNI, role, organization/gym/branches; edit full name and phone via `PATCH /me`; change password via
   `POST /me/password` (current + new, 8+); after a password change the old token dies, so sign in again with the new one (the API returns a fresh token if the contract says so; follow `openapi.yaml`).
5. **Lookups**: switch every "Buscar" button (client creation, member forms, day pass) to the API; delete `src/services/documentLookup.ts`.
6. **E2E harness**: Playwright config starts nothing; it expects the API at `API_URL`. Helper `tests/support/api.ts` creates a superadmin session by logging in with credentials from env
   (`E2E_SUPERADMIN_DNI`, `E2E_SUPERADMIN_PASSWORD`, created by hand locally) and creates the data a test needs through the API; cleanup deletes nothing (API has no delete):
   use unique DNIs (random 8 digits) per run. Document this in `tests/README.md`.
7. Delete demo-only auth code (`DemoUser` accounts list, `Pulso2026!` hints) but keep types that are still used by unmigrated slices until WEB-06.

## Tests

Login success/failure/lockout message, route guard, token not in `localStorage`/`sessionStorage`, reload returns to login, profile edit and password change, 401 handling,
lookup success/404/503.

## Acceptance

Log in as the manually-created superadmin against the local API and see the superadmin shell; wrong password shows the Spanish message; profile edit persists after logout/login.

## Gaps and questions

Q-PASSWORD-RESET: there is no recovery (by design); the login page says nothing about it. Confirm with the owner only if asked.

## Completion — 2026-10-27

Implemented and verified against the real API; see `docs/RELEASE.md` for what changed, the tests and the open points.
