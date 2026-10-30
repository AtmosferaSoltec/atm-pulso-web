# End-to-end tests

They run in a real browser, but **atm-auth-api and pulso-api are mocked** in the page (`support/mocks.ts`), so they
need no backend, database or tokens. Playwright starts the web on port 4175 with `VITE_AUTH_API_URL=http://auth.test`
and `VITE_API_URL=http://api.test/api/v1`, and the mocks answer those origins.

```sh
pnpm exec playwright install chromium   # once
pnpm test:e2e
```

They cover the session: login errors, the first-password flow, restoring the session after a reload and the gym selector.
A cross-repository suite against the real services (auth-api with a Pulso system and tenants, pulso-api) is pending.
