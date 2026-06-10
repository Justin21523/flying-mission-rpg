import { defineConfig, devices } from '@playwright/test';

// End-to-end tests boot THIS project's dev server and drive a browser. Used for whole-flow smoke tests
// (e.g. "the homepage mounts the 3D canvas"). The full core-loop run lands in a later batch.
//
// Dedicated port (+ --strictPort) so the e2e never accidentally reuses an unrelated dev server running on
// the default 3000 — it must test this app, not whatever else is on the machine.
const PORT = 4317;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
