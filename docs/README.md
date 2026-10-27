# Pulso web: implementation docs

These documents are for the AI (or developer) that connects this prototype to the real API. The API repository
(`../atm-pulso-api`) has the matching plans and is the **source of truth** for rules and the contract:

- `../atm-pulso-api/docs/domain/business-rules.md`: every business rule.
- `../atm-pulso-api/docs/openapi.yaml`: the contract. Types here are generated from it.
- `../atm-pulso-api/docs/plans/`: API plans 01 to 06.

## How to work

1. Read `AGENTS.md` (rules, UI principles) and `docs/api-integration.md` (how the web talks to the API).
2. Follow `docs/plans/00-roadmap.md` in order. Web plan N needs API plan N accepted and running locally.
3. Work **locally only**: web on `http://localhost:5173`, API on `http://localhost:3001`. Do not push, deploy, or touch the server.
4. One plan = one branch of commits on `main` (no push). Conventional Commits.
5. Never invent API behavior. If the contract lacks something, write it down under "Gaps" in the plan, and ask the owner or the API side.

## Definition of done (every plan)

- [ ] `pnpm lint`, `pnpm build` (zero type errors) and `pnpm test:unit` pass.
- [ ] The e2e suite for the slice passes **against the real local API** (not mocks); old demo-only tests are replaced or deleted.
- [ ] The demo store no longer feeds the slice: its code in `src/store` for that domain is deleted, not left unused.
- [ ] No hardcoded dates or sample data; loading, empty and error states exist and are in Spanish.
- [ ] UI follows AGENTS.md section 5 (icons with labels, status colours, `Field`, `OptionCards`, `DatePicker`).
- [ ] Roles verified in the browser: superadmin, owner, admin, receptionist.
- [ ] A short summary is added at the end of the plan file (what changed, gaps, questions for the owner).

## Global rules for this work

- Identifiers and comments in English; visible text in Spanish.
- Server state through TanStack Query inside each feature's `hooks/`; never call `fetch` from components.
- The access token lives **in memory only** (no `localStorage`); a page reload means login again. See `api-integration.md`.
- Show what the API returns; never compute money, status or receipt numbers on the client.
- Error mapping: API error `code` to Spanish messages in one place per feature (`errorMessages.ts`), with a generic fallback.
