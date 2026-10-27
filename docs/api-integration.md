# Talking to the API

## Setup (one time, in plan WEB-01)

- Dependencies: `@tanstack/react-query`, `openapi-typescript` (dev), nothing else for HTTP (use `fetch`).
- Script: `"api:types": "openapi-typescript ../atm-pulso-api/docs/openapi.yaml -o src/types/api.generated.ts"`. Regenerate whenever the contract changes. Commit the generated file.
- Env: `VITE_API_URL` (default `http://localhost:3001/api/v1`; use the API's real port); document it in `.env.example`. Production value is set by the deployer at build time (do not hardcode URLs).
- Client in `src/config/apiClient.ts` (or `src/services/`): a typed `request<T>(method, path, {body, query, signal})` that
  - adds `Authorization: Bearer <token>` from the auth store (memory),
  - sends `X-Organization-Id` only when a superadmin is inspecting a client (GET only),
  - parses `{ "data": ..., "meta": ... }` and errors `{ "error": { "code", "message", "details" } }` into an `ApiError(status, code, details)`,
  - on `401` clears the session and sends the user to the login page (once, no loops).
- `QueryClientProvider` in `main.tsx`; defaults: `retry: false` for mutations, 1 retry for queries except 4xx; `staleTime` 30 s.

## Conventions

- Query keys per feature: `['members', filters]`, `['catalog']`, `['clients', filters]`... Mutations invalidate the keys they affect.
- Every creation sends a client-generated `id` (`crypto.randomUUID()`) so a double click or retry is idempotent.
- Money stays a string end to end; format with `formatCurrency`. Dates are `YYYY-MM-DD` strings; show them in Lima time; use `DEMO_DATE` only inside tests.
- Lists use `page` and `page_size` and render `meta`; filters live in the URL query string where the prototype already did.
- Disable the submit button while a mutation is pending; show field errors from `details[{field, code}]` next to their `Field`.

## Auth store

`src/store/authStore.ts` (Context or Zustand) with `{ token, user, login(dni, password), logout() }`. `user` is what `GET /me` returns
(id, full_name, document_number, role, organization, gym, branches). Permissions helpers in `features/auth` read `user`; they must match
business-rules (owner: all; admin: own gym; reception: assigned branches; superadmin: read-only inspection).

## Lookups (DNI/RUC)

The "Buscar" buttons call the API (`GET /lookups/dni/{n}`, `GET /lookups/ruc/{n}`) instead of `src/services/documentLookup.ts`, which is deleted at WEB-01.
Show a loading state, and a Spanish message when the API answers `404 NOT_FOUND` or `502`/`503` (service unavailable): the user may still type the data by hand.

## Local run

1. Start Postgres and the API as described in `../atm-pulso-api/README.md` (`scripts/dev.sh`).
2. Create the first superadmin by hand with `go run ./scripts/first-superadmin` (piped to psql). Never add seed code.
3. `pnpm dev`. For e2e, create the data each test needs through the API (see plan WEB-01 for the helper) and clean up after.
