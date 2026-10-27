# Pulso (web)

Web client of **Pulso**, Atmósfera's gym administration product: React 19, TypeScript and Vite, with a
Spanish UI. It talks to the real API in `../atm-pulso-api`; there is no demo data. Product overview:
[docs/product-overview.md](docs/product-overview.md). Rules for working on the code: [AGENTS.md](AGENTS.md).

## Run it locally

You need the API running (see `../atm-pulso-api/README.md`) and a first superadmin created by hand.

```sh
pnpm install
cp .env.example .env     # VITE_API_URL, the API's address (default http://localhost:3001/api/v1)
pnpm dev
```

The session lives in memory only (nothing sensitive in the browser's storage), so a reload means signing in again.

## Verification

```sh
pnpm lint
pnpm build                 # tsc -b + vite build
pnpm test:unit
pnpm test:e2e              # needs the API and a database: see tests/README.md
```

## Types from the contract

`src/types/api.generated.ts` is generated from the API's `docs/openapi.yaml`. Run `pnpm api:types` after the
contract changes and commit the result. `src/types/api.types.ts` names the shapes the screens use.

## Roles

| Role | Created by | Sees | Can manage |
| --- | --- | --- | --- |
| `superadmin` | inserted by hand (the first), then by another superadmin | Every client, read-only | Clients, gyms and branches |
| `owner` | Superadmin | Every gym and branch of the account | All users, rules and identity of every gym |
| `admin` | Owner | One gym and its branches | Reception users, rules, prices and identity of that gym |
| `receptionist` | Owner or admin | Only the assigned branches | Members, payments and access control |

Only the owner creates administrators; an administrator creates reception staff. A new user's first password is
their DNI and must be changed at the first sign-in. Permission helpers (`src/features/auth/services/permissions.ts`)
only decide what to show: the API enforces every rule.

## Where things are

- `src/config/apiClient.ts`: the only place that talks HTTP (token in memory, error mapping).
- `src/features/<module>/hooks`: TanStack Query hooks per feature; screens never call `fetch`.
- `src/config/errorMessages.ts`: Spanish text for the API's error codes.
- Business rules (member status, receipt numbers, dates, totals) are computed by the API; the web shows what it answers.

The free plan is 1 gym and 1 branch per gym (`src/config/freePlan.ts`, used for wording); extras are created by the
superadmin after agreeing them with the client.
