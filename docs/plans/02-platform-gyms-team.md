# WEB-02: catalog, clients, gym settings, team

**Needs:** API-02. **Read first:** `src/features/platform`, `organization`, `branding`, `team`, `auth/services/permissions.ts`, API plan 02.

## Build

1. `useCatalog()` (`GET /catalog`) replaces `useOrganizationCatalog`; the branch/gym pickers, headers and filters read it. `accessible` decides what is selectable.
2. **Superadmin clients** (`/clients`): list with search and pagination, summary cards from `/clients/summary`, plan chip from `plan.state`
   ("Plan gratuito" or "N extras" via the wording helper), create-client dialog posting `/clients` with owner (DNI search button), gyms and branches, and the "Ya lo acordé con el cliente"
   confirmation sending `agreed_extra: true`. A `409 PLAN_LIMIT_EXCEEDED` shows the extras and offers the confirmation. Add gym/branch actions post to `/clients/{id}/gyms` and `/gyms/{id}/branches`.
3. **Inspection**: when the superadmin opens a client, send `X-Organization-Id` on GET requests only; every write control is hidden (read-only banner as today).
4. **Gym settings** (owner, admin of that gym): display name, brand colour (picker + hex), day pass price, branch sharing toggle through `PATCH /gyms/{id}`. Hide the logo upload (Q-LOGO).
5. **Team**: `GET /users`, create/edit with `POST/PATCH /users`, activate/deactivate, set password. Role rules in the form: only owners can pick admin. Replace the "contraseña de prueba" notice by a field to type the initial
   password (8+). Show `is_self` as "Tu cuenta".
6. Remove the local free-plan arithmetic from the UI: render what `plan` says; keep wording helpers only.

## Tests (e2e against the API)

Superadmin creates a client with and without extras (409 then confirm), owner of that client logs in and sees its gyms/branches only, owner creates admin and receptionist, admin cannot create admins (option absent),
receptionist sees no team page, deactivated user cannot log in, password reset works, inspection is read-only, branding colour change persists after reload.

## Acceptance

All role views match the prototype; no demo store use in these screens; grep proves `useDemoStore` is not imported by platform, organization, branding or team.

## Completion — 2026-10-27

Implemented and verified against the real API; see `docs/RELEASE.md` for what changed, the tests and the open points.
