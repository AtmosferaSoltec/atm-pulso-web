# Pulso Gym

Interactive gym administration prototype built with React, TypeScript, and Vite. Spanish operational UI; one light theme in petroleum blue and teal.

## Run locally

```sh
pnpm install
pnpm dev
```

## Verification

```sh
pnpm build
pnpm lint
pnpm test:unit
pnpm exec playwright install chromium
pnpm test:e2e
```

The browser suite starts Vite on port 4175 or reuses an existing server there. Generated reports, traces, screenshots, and print PDFs are ignored by Git.

## Demo accounts

The login page can populate each fictional account. The password for all accounts is `Pulso2026!`.

| DNI | Role | Scope |
| --- | --- | --- |
| 10000001 | Superadmin (Atmósfera) | All client accounts, read-only |
| 10000002 | Owner | Every gym and branch of Grupo Atlas |
| 10000005 | Admin | Atlas Fitness only (two branches) |
| 10000003 | Receptionist | Atlas Miraflores and Barranco |
| 10000004 | Owner | Gimnasio Central (single site) |

There is no public registration. The Atmósfera superadmin creates each client (an owner) together with their gyms and branches through the platform panel. Users sign in with DNI and password; there is no account recovery flow.

## Roles

| Role | Created by | Sees | Can manage |
| --- | --- | --- | --- |
| `superadmin` | Atmósfera | Every account, read-only | Clients, gyms and branches |
| `owner` | Superadmin | Every gym and branch of the account | All users, rules and identity of every gym |
| `admin` | Owner | One gym (`gymId`) and its branches | Reception users, rules, prices and identity of that gym only |
| `receptionist` | Owner or admin | Only the assigned branches (`branchIds`) | Members, payments and access control |

Only the owner creates administrators; an administrator creates reception staff. Permission helpers live in `src/features/auth/services/permissions.ts`.

## Organization model

- **Organization**: an owner's isolated account. Member lookup, policies, and users belong to it.
- **Gym**: a named business with its own fictional RUC (`DEMO-001`, etc.).
- **Branch**: a gym's operating location. The active branch determines where access events and payments are recorded.
- **User**: belongs to one account and has assigned branches. Owners and administrators manage the rules, prices, branding and users of the gyms they control. Reception is restricted to members, access, and payment operations; its home page is access control.
- **Member**: belongs to one account, has a home branch, and a membership access scope. A DNI is unique within its owner's account.

The prototype includes Atlas Fitness with two branches sharing one RUC, two other gyms with distinct RUCs under the same owner, and a separate single-site account.

### Sharing rules

1. **Member directory**: always shared by every gym and branch of the same owner, so nobody is typed in twice. There is no setting for it.
2. **Access between branches**: a rule per gym, controlled by that gym's administrator (or the owner) in "Gimnasios y reglas". When off, the gym's members only enter their enrollment branch, even if their membership says otherwise.
3. **Membership access**: chosen per member at enrollment. It starts as "enrollment branch only"; wider access (the gym or the whole network) lists the branches, all selected, and any can be unchecked. A valid date alone does not grant branch permission.

These options model differences as configuration instead of separate applications. A future backend must enforce the same account/branch boundaries and permissions; the mock login is not production authentication.

## Operational flows

- Login, password visibility, invalid-credential handling, recovery instructions, and logout.
- Branch switcher with only assigned branches; single-site accounts show branch information.
- Unified members view: all, valid, expiring, expired, and scheduled; name/DNI search and home-branch filter.
- Editable contact details, WhatsApp reminders, and printable membership sheets.
- Registration and renewal without a plan catalog. Memberships are always sold by the month (1 to 24). Quick duration/price references can be replaced with a custom number of months and a total amount; there are no percentage discounts, any discount is negotiated directly in the amount.
- **Day pass**: a single-entry sale from Control de acceso. It is not a membership: reception only picks the payment method (customer data is optional, for future promotions), the person is let in and the sale shows in the access log and in Pagos with its own numbering (`D-000001`). The price is fixed per gym and edited by its administrator or owner in "Tarifas".
- **Pagos** opens on today's payments and offers "Este mes" or a custom *Desde / Hasta* range, with KPIs for the filtered period.
- Calendar month arithmetic clamps to the last day of the target month. Future renewals preserve current coverage. Future registrations do not grant immediate access.
- Each renewal adds a separate payment snapshot assigned to the collecting branch. The member's home branch remains unchanged.
- Payment filters and CSV export; access events persist when switching pages/branches during the session.
- Dashboard counts, revenue, and access activity reflect the selected branch. The prior-week attendance chart remains an illustrative fixture.

## Sample access cases

| DNI | Member | Scenario |
| --- | --- | --- |
| 76381249 | Camila Torres | Network access while valid |
| 72941856 | Diego Mendoza | Atlas branches only |
| 75819362 | Luciana Vargas | Norte home branch only |
| 70294618 | Mateo Ramírez | Expired membership |
| 80123456 | Mariana León | Separate Central account only |
| 11111111 | Unregistered | Access denied |

All data is fictional; phones must not be treated as real recipient contacts. Opening WhatsApp does not automatically send a message. The reference date is October 26, 2026. All changes live in React state and reset on reload; they remain available across logout/login within the same browser tab. There is no backend, durable storage, real payment processing, email delivery, or actual authentication. Mock permissions are enforced in the UI and state action handlers; a production backend must enforce them independently. Google Fonts supplies optional typography with sans-serif fallbacks.

## Architecture

Domain logic is scoped to feature modules with public barrel exports. `auth` handles mock login, `organization` holds the owner/gym/branch model and policies, `members` handles enrollment and member records, `access` evaluates branch/date eligibility, and `payments` presents the collection ledger. Shared controls live in `src/components/ui`; the workspace layout coordinates those modules.

The checked-in tests cover authentication, owner/staff access, tenant isolation, branch switching, shared-directory policies, membership scope, custom prices, renewal collection, printing, duplicate DNI, contact editing, CSV export, future start dates, calendar arithmetic, and mobile layouts.


## Platform and tenant roles

| Role | Scope | Capabilities |
| --- | --- | --- |
| `superadmin` | Atmósfera platform | Create clients, initial administrators, gyms, and branches; consult all client operations without recording operational changes |
| `admin` | One client account | Manage users, assigned locations, identity, rules, members, payments, and access; cannot create gyms/branches |
| `receptionist` | Assigned locations of one account | Register/renew/edit members, record related payments, and check access; no dashboard, account settings, user management, or branding |

The platform creation form supports business/individual accounts, several gyms, and several branches per gym. RUC is optional, may repeat across gyms, and is not an identity or sharing-policy key. Client users are isolated by organization ID, not by RUC.

Administrators can create admin or reception users, update roles/assignments, and activate/deactivate them. They cannot create superadmins or alter their own account through the team form. A new user can log in using the displayed mock password without reloading the application.

## White-label identity

The generic login retains Pulso. Authenticated screens use the active gym's display name, uploaded logo (PNG/JPG/WebP, up to 2 MB), and chosen primary color. Sibling branches share their gym identity; a different gym can have another identity under the same client account. The tenant name is used in the browser title and the logo or generated monogram in the favicon. Printed membership sheets use the home gym's identity. A discreet Atmósfera footer remains.

The system stays light even when the primary color changes. Primary-action text contrast is selected based on the color luminance. Identity settings have a draft preview and only apply after saving. Images stay in in-memory data URLs; no upload endpoint or external write is involved. A real branded domain or tenant-specific login has not been configured.

The additional role suite verifies superadmin consultation restrictions, repeated-RUC onboarding, dynamic administrator login, user assignment/deactivation, reception route guards, branding uploads and propagation, and mobile platform layouts.

## Deployment

Only a push to the `production` branch deploys (`.github/workflows/deploy.yml`):
lint, build, unit and e2e tests → Docker image published to GHCR → the server pulls
it and restarts the container. It can also be rerun from the Actions tab.

- URL: https://pulso.atmosferast.com
- Server: `/opt/pulso-web` (compose file copied on each deploy), container `pulso-web` on `127.0.0.1:3080`
- Host nginx: `/etc/nginx/sites-available/pulso.atmosferast.com` (wildcard origin certificate)
- Repository secrets: `SSH_HOST`, `SSH_USER`, `SSH_KEY`

Flow: commit to `main`, then fast-forward `production` and push it.

## Business model: free plan

Pulso is **free, within limits**: **1 gym and up to 3 branches per gym** per client (`src/config/freePlan.ts`).
Owners and administrators cannot add gyms or branches themselves. If a client needs more, it is agreed
directly with Atmósfera, which creates the extra gyms or branches and charges for them.

In the superadmin panel this is visible as a note, a "Plan gratuito" / "N extras" chip on every client, and
a required confirmation ("Ya lo acordé con el cliente") whenever something being created goes beyond the plan.
