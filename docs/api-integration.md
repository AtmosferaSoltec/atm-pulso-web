# Talking to the API

## Setup (one time, in plan WEB-01)

- Dependencies: `@tanstack/react-query`, `openapi-typescript` (dev), nothing else for HTTP (use `fetch`).
- Script: `"api:types": "openapi-typescript ../atm-pulso-api/docs/openapi.yaml -o src/types/api.generated.ts"`. Regenerate whenever the contract changes. Commit the generated file.
- Env: `VITE_API_URL` (pulso-api, default `http://localhost:3001/api/v1`) and `VITE_AUTH_API_URL` (atm-auth-api, default `http://localhost:3130`); both in `.env.example`. Production value is set by the deployer at build time (do not hardcode URLs).
- Client in `src/config/apiClient.ts` (or `src/services/`): a typed `request<T>(method, path, {body, query, signal})` that
  - adds `Authorization: Bearer <access token>` that atm-auth-api issued (`authSession.getAccessToken` renews it before it expires),
  - parses `{ "data": ..., "meta": ... }` and errors `{ "error": { "code", "message", "details" } }` into an `ApiError(status, code, details)`,
  - on `401` asks atm-auth-api for a new token and retries once; if that fails it clears the session and sends the user to the login page.
- `QueryClientProvider` in `main.tsx`; defaults: `retry: false` for mutations, 1 retry for queries except 4xx; `staleTime` 30 s.

## Conventions

- Query keys per feature: `['members', filters]`, `['catalog']`, `['clients', filters]`... Mutations invalidate the keys they affect.
- Creations of business records send a client-generated `id` (`crypto.randomUUID()`) so a double click or retry is idempotent. Team users are the exception: their id is the atm-auth-api user id, assigned by the API.
- Money stays a string end to end; format with `formatCurrency`. Dates are `YYYY-MM-DD` strings; show them in Lima time; use `DEMO_DATE` only inside tests.
- Lists use `page` and `page_size` and render `meta`; filters live in the URL query string where the prototype already did.
- Disable the submit button while a mutation is pending; show field errors from `details[{field, code}]` next to their `Field`.

## Auth

The browser calls **atm-auth-api directly**: `POST /v1/login {dni, password, system: "pulso"}`, `/v1/refresh`, `/v1/logout`,
`/v1/password/change`, and `GET /v1/session/tenants` + `POST /v1/refresh {refresh_token, tenant_id}` for the gym selector.
A first login answers `403 password_change_required` (no token); the first-password page changes it and signs in again.
`src/features/auth/services/authSession.ts` keeps the access token in memory and the refresh token in `localStorage`
(`persistent`) or `sessionStorage` (`temporary`), and serializes renewals between tabs with `navigator.locks`.

`src/store/authStore.ts` exposes `{ user, tenants, login, logout, switchGym }`. `user` is what pulso-api's `GET /me` returns
(id, full_name, document_number, role `admin|receptionist`, organization, gym, branches). Permission helpers in `features/auth`
read `user`: admin sees every branch of the gym, reception only the assigned ones. Pulso-api answers `NO_ACCESS` (403) when
the person has no role in Pulso and `USER_INACTIVE` when an admin deactivated them.

## Lookups (DNI/RUC)

The "Buscar" buttons call the API (`GET /lookups/dni/{n}`, `GET /lookups/ruc/{n}`) instead of `src/services/documentLookup.ts`, which is deleted at WEB-01.
Show a loading state, and a Spanish message when the API answers `404 NOT_FOUND` or `502`/`503` (service unavailable): the user may still type the data by hand.

## Local run

1. Start Postgres and the API as described in `../atm-pulso-api/README.md` (`scripts/dev.sh`).
2. Start atm-auth-api and, in the console, create a client, a company with the system `pulso` enabled and an `admin` user (with `manage_users`). Never add seed code.
3. `pnpm dev`. The e2e tests mock both APIs in the browser (`tests/README.md`).
