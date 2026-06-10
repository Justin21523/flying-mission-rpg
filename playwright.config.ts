import { defineConfig, devices } from '@playwright/test';

// End-to-end tests boot the real dev server and drive a browser. Used for whole-flow smoke tests
// (e.g. "the homepage mounts the 3D canvas"). The full core-loop run lands in a later batch.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
