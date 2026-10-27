# WEB-04: access control and day passes

**Needs:** API-04. **Read first:** `src/features/access`, `dayPasses`, API plan 04.

## Build

1. Access page: document input (with scan-friendly autofocus) posting `POST /access/checks`; show a big green "Permitido" or red "Denegado" result with the Spanish reason map:
   `NO_MEMBERSHIP`, `NOT_STARTED` (with date), `EXPIRED` (with date), `BRANCH_NOT_INCLUDED`; amber note when `expiring_in_days` is present. The branch comes from the current working branch selector.
2. Keep the legend buttons (access types/client types) as in the prototype; no "add member" button here.
3. History from `GET /access/events` (filters: result, dates, search) and counters from `/access/summary`.
4. Day pass dialog: price prefilled from the gym's effective price in `/catalog`, editable, method chips, optional visitor (document search + name); posts `/day-passes`; prints/shows `D-000001`.
5. Day pass list from `GET /day-passes`.

## Tests (e2e)

Allowed, expired, not started, other-branch denied, document not found, expiring warning, history shows the attempt, day pass default price and custom amount, receipt number format, receptionist cannot pick an unassigned branch.

## Acceptance

Every check shows server time; no member status logic remains in `features/access`.
