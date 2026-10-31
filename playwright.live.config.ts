import { defineConfig } from '@playwright/test';

// Live checks against the LOCAL stack started by atm-pulso-api/scripts/dev-all.sh (nothing is mocked).
// Run: LIVE_WEB=http://localhost:5173 pnpm exec playwright test -c playwright.live.config.ts
export default defineConfig({
  testDir: './tests/live',
  testMatch: '**/*.live.ts',
  workers: 1,
  timeout: 120_000,
  use: { baseURL: process.env.LIVE_WEB ?? 'http://localhost:5173', headless: true },
});
