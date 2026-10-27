import { defineConfig } from '@playwright/test';

// The tests run against a real local API (see tests/README.md). The web is started here,
// pointing at it.
const apiUrl = process.env.E2E_API_URL ?? 'http://127.0.0.1:3091/api/v1';

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
    env: { VITE_API_URL: apiUrl },
  },
});
