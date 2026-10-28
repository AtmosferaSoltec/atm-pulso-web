# Web roadmap

Replace the in-memory demo (`src/store`, `DEMO_DATE`, sample data) by the real API, slice by slice, always locally.

| Plan | Scope | Needs API plan |
|---|---|---|
| WEB-01 foundation-auth-profile | API client, TanStack Query, generated types, login, profile, lookups, e2e harness | 01 |
| WEB-02 platform-gyms-team | Catalog, superadmin clients, gym settings and branding, team | 02 |
| WEB-03 members-and-receipts | Members list/filters, enrollment, renewal, member sheet, receipt | 03 |
| WEB-04 access-and-day-passes | Access check, history, day passes | 04 |
| WEB-05 payments-and-dashboard | Payments filters/KPIs/download, dashboard | 05 |
| WEB-06 cleanup-and-release | Delete demo code, final e2e, hand-over | 06 |

Fixed decisions: token in memory; no demo accounts or seed data (the real first superadmin is inserted manually); there are no plans or limits
(only the superadmin creates gyms and branches and sets a gym's identity);
gym logo upload is **hidden** until the owner approves Q-LOGO (keep the colour and the monogram).
