import { defineConfig } from '@playwright/test';

// The tests mock atm-auth-api and pulso-api in the browser (tests/support/mocks.ts), so they need no backend.
export const AUTH_URL = 'http://auth.test';
export const API_URL = 'http://api.test/api/v1';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:4175', headless: true, viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
    env: { VITE_API_URL: API_URL, VITE_AUTH_API_URL: AUTH_URL },
  },
});
