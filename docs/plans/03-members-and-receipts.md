# WEB-03: members, enrollment, renewal, receipt

**Needs:** API-03. **Read first:** `src/features/members` (all), `memberships`, `pricing`, `payments` (receipt parts), `tests/enrollment.test.mjs`, API plan 03.

## Build

1. Members list from `GET /members` with search (debounced 300 ms), status chips with counts from `meta.counts`, home-branch filter, pagination. Row actions keep fixed slots (view, renew, message).
2. **Enrollment form** posts `POST /members` with: document type/number (DNI/CE), full name (search button for DNI), phone (required, 9 digits), months (1 to 24), start date (defaults to today),
   amount ("Importe"), method chips (Efectivo, Yape/Plin, Tarjeta, Transferencia), access scope and branch list (home branch always included, others can be unchecked). Display `409 MEMBER_DOCUMENT_TAKEN` with a link to the existing member.
3. **Renewal** posts `/members/{id}/renewals`; the suggested start date is only a hint (the API decides).
4. **Member sheet** from `GET /members/{id}`: periods, access branches, receipts list; edit name/phone via `PATCH`.
5. **Receipt** view/print from `GET /receipts/{id}` (number `R-000001`, gym display name, RUC, terms text as today). Delete client-side receipt numbering and end-date/status calculators once the API responses are used;
   keep `tests/enrollment.test.mjs` only for helpers that remain, otherwise replace with e2e.
6. Message (WhatsApp) action builds the link from the phone; no API call.

## Tests (e2e)

Enroll DNI and CE, duplicate document, renew an expired and an active member (dates), scope with unchecked branches, receptionist limited to assigned branches, status counts match rows,
receipt shows the number returned by the API, double-click on submit creates one member, errors map to Spanish.

## Acceptance

No member/membership data comes from `src/store`; status colours match business-rules; amounts displayed exactly as returned (strings).
