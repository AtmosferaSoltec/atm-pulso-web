# Pulso (web)

Web client of **Pulso**, Atmósfera's gym administration product: React 19, TypeScript and Vite, with a
Spanish UI. It talks to the real API in `../atm-pulso-api`; there is no demo data. Product overview:
[docs/product-overview.md](docs/product-overview.md). Rules for working on the code: [AGENTS.md](AGENTS.md).

## Run it locally

You need pulso-api (`../atm-pulso-api/README.md`) and atm-auth-api (`../atm-auth-api/README.md`) running, with the system `pulso`, a company and an `admin` user created in the console.

```sh
pnpm install
cp .env.example .env     # VITE_API_URL (pulso-api, default http://localhost:3001/api/v1) and VITE_AUTH_API_URL (atm-auth-api, default http://localhost:3130)
pnpm dev
```

The access token lives in memory only; the refresh token (atm-auth-api's) lives in `localStorage` or `sessionStorage` depending on the system's session policy, and brings the session back after a reload.

## Verification

```sh
pnpm lint
pnpm build                 # tsc -b + vite build
pnpm test:unit
pnpm test:e2e              # mocks atm-auth-api and pulso-api in the browser: see tests/README.md
```

## Types from the contract

`src/types/api.generated.ts` is generated from the API's `docs/openapi.yaml`. Run `pnpm api:types` after the
contract changes and commit the result. `src/types/api.types.ts` names the shapes the screens use.

## Roles

Two roles, defined for the system `pulso` in atm-auth-api (the token carries them as `app_role`):

| Role | Created by | Sees | Can manage |
| --- | --- | --- | --- |
| `admin` | Atmósfera (console) or another admin | Every branch of the gym it works in | Team, prices, branch-sharing rule and colour of that gym |
| `receptionist` | An admin | Only the assigned branches | Members, payments and access control |

A person may work for several gyms (one atm-auth-api company each); the sidebar then shows a gym selector that switches the
session with `POST /v1/refresh`. Gyms and branches are created by Atmósfera in the console, never in Pulso. A new user's first
password is their DNI and must be changed at the first sign-in. Permission helpers
(`src/features/auth/services/permissions.ts`) only decide what to show: the API enforces every rule.

## Where things are

- `src/config/apiClient.ts`: the only place that talks to pulso-api (bearer token, one retry after a forced refresh, error mapping).
- `src/features/auth/services/authApi.ts` and `authSession.ts`: the only code that talks to atm-auth-api (login, refresh with a lock between tabs, logout, password change, gym switch).
- `src/features/<module>/hooks`: TanStack Query hooks per feature; screens never call `fetch`.
- `src/config/errorMessages.ts`: Spanish text for the API's error codes.
- Business rules (member status, receipt numbers, dates, totals) are computed by the API; the web shows what it answers.

There are no plans or limits in Pulso: gyms and branches (and a gym's name and logo) are created by Atmósfera in the console.
