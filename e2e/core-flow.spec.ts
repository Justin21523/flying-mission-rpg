import { test, expect } from '@playwright/test';

// Batch 13 — drive the Debug AutoPlaytester through the whole core flow (one legal transition at a time)
// and assert it reaches MISSION_COMPLETE without serious console errors. The AutoPlaytester is triggered via
// the window debug hook — Playwright never sets the game phase directly.
test('AutoPlaytester completes the core flow', async ({ page }) => {
  // Ignore benign WebGL/asset noise (headless has no GPU textures); we only care about real code errors.
  const benign = /GLTFLoader|THREE\.|Couldn't load texture|deprecated|WebGL/i;
  const errors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error' && !benign.test(msg.text())) errors.push(msg.text()); });
  page.on('pageerror', (err) => { if (!benign.test(err.message)) errors.push(err.message); });

  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });

  // Wait for the debug hook to be installed.
  await page.waitForFunction(() => typeof window.__autoPlaytester !== 'undefined', null, { timeout: 20_000 });

  // Start a run and poll until it completes or fails.
  await page.evaluate(() => window.__autoPlaytester!.start());
  await page.waitForFunction(() => {
    const s = window.__autoPlaytester!.status();
    return s === 'completed' || s === 'failed' || s === 'cancelled';
  }, null, { timeout: 90_000 });

  const snapshot = await page.evaluate(() => window.__autoPlaytester!.snapshot());
  expect(snapshot.status, `auto playtester ended: ${snapshot.failureReason ?? ''}\n${snapshot.log.join('\n')}`).toBe('completed');
  expect(snapshot.currentPhase).toBe('MISSION_COMPLETE');

  // No uncaught page errors (WebGL context warnings are not 'error' type).
  expect(errors, errors.join('\n')).toHaveLength(0);
});
