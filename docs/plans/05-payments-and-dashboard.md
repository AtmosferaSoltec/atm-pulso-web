# WEB-05: payments and dashboard

**Needs:** API-05. **Read first:** `src/features/payments`, `dashboard`, API plan 05.

## Build

1. Payments page from `GET /payments`: dates on the left, chips on the right (method), KPI cards from `meta.totals`, pagination. "Descargar" opens `GET /payments/export` with the same filters
   (fetch with the Bearer token and save the blob; do not put the token in the URL).
2. Dashboard from `GET /dashboard`: members by status, income today/month, access today, expiring-soon list with WhatsApp action. Empty organization shows zeros, no placeholder charts.
3. Remove every hardcoded or derived-from-`DEMO_DATE` figure.

## Tests (e2e)

Totals match the visible rows, filters combine, download contains the same row count, empty dashboard, reach per role (reception sees only assigned branches).

## Acceptance

No sample data anywhere; KPIs equal API totals.

## Completion — 2026-10-27

Implemented and verified against the real API; see `docs/RELEASE.md` for what changed, the tests and the open points.
