# Release notes: web connected to the API (WEB-01 to WEB-06)

> **Superseded by the groups model (API plan 07):** "client", "organization" and "owner" below are history. Today a *group* is an internal label (never shown), a gym is a brand, members belong to a gym, and only `admin` and `receptionist` exist.

Hand-over for whoever deploys. Nothing was pushed or deployed.

## What changed

The in-memory prototype is gone: every screen reads and writes through the real API (`../atm-pulso-api`).

| Plan | Result |
|---|---|
| WEB-01 | `apiClient` (token in memory, error mapping), TanStack Query, types generated from `openapi.yaml`, real login, forced first-password page, profile, DNI/RUC lookups through the API |
| WEB-02 | Catalog context, superadmin clients (create with the extras agreement, add gym or branch, inspect read-only), gym settings (branch sharing, prices, identity), team (create, edit, DNI correction, activate, reset password) |
| WEB-03 | Members list with server-side search, status filters, counts and pagination; enrollment and renewal; reprintable receipts from `/receipts/{id}` |
| WEB-04 | Access check decided by the server (reasons mapped to Spanish), history, day pass at the gym's price |
| WEB-05 | Payments with totals of the whole filter and CSV download (Bearer header, never in the URL), dashboard with real figures |
| WEB-06 | Demo store, sample data and demo accounts deleted; dead styles removed; e2e suite rewritten against the real API |

## Deployer checklist

1. **The API must be deployed first** (with migrations 00003 to 00006 and the CORS fix that allows `X-Organization-Id`).
2. Insert the first superadmin by hand (`go run ./scripts/first-superadmin` in the API repo, piped to `psql`).
3. The image now needs the API address at **build time**: `Dockerfile` takes `ARG VITE_API_URL` and the workflow passes
   `VITE_API_URL=https://pulso-api.atmosferast.com/api/v1`. The API's `CORS_ORIGIN` must be `https://pulso.atmosferast.com`.
4. CI (`deploy.yml`) no longer runs the e2e suite: it needs the API and a database. Run it locally before releasing
   (`tests/README.md`). A cross-repository e2e job is a future improvement.
5. Smoke test after deploy: sign in as the superadmin, create a test client, sign in as its owner (first-password page), enroll a member, see the receipt.

## Verified

`pnpm lint`, `pnpm build` (zero type errors), `pnpm test:unit` and **20 end-to-end tests against the real API**
(authentication, forced password change, superadmin, owner, admin and reception flows, enrollment, renewal, receipts, access, day pass, payments, CSV, dashboard, settings).
Running them against the real API found and fixed a real bug: the API's CORS preflight rejected the `X-Organization-Id` header, which would have blocked the superadmin from consulting any client in the browser.

## Behavior to know

- A reload signs the user out (the token is never stored). This is deliberate.
- The dashboard's "próximos vencimientos" list uses the members list (`status=expiring`) so its rows keep the quick actions; the counts come from `/dashboard`.
- Renewal start date: the form suggests the current end date; the server takes the one sent. The gym logo is shown from `logo_url` (a temporary signed link of the company profile logo, resolved by pulso-api); without it, or if it fails to load, the monogram is shown.

## Open points

- A cross-repository e2e job in CI.
- Logo upload (Cloudflare R2) and the ideas listed in `docs/product-overview.md` section 9.

## Central authentication (atm-auth-api)

Login no longer goes through pulso-api. Before deploying:

1. atm-auth-api must have the system `pulso` with roles `admin` and `receptionist`, the client's companies enabled for it, and an `admin` access (with `manage_users`) per person.
2. The image needs a second build argument: `VITE_AUTH_API_URL` (for example `https://auth.atmosferast.com`). `Dockerfile` takes it; **`.github/workflows/deploy.yml` must pass it next to `VITE_API_URL`** (not changed here).
3. atm-auth-api's `CORS_ALLOWED_ORIGINS` must list `https://pulso.atmosferast.com` (the browser calls it directly).
4. The earlier smoke test (superadmin, owner) no longer applies: sign in as an `admin`, change the first password, enroll a member, see the receipt; with two gyms, use the gym selector.
