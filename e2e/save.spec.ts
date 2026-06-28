import { test, expect } from '@playwright/test';

// Batch 13 — progress persists: mark a mission complete + save, reload, and the save summary still reflects
// it. Driven through the debug bridge (no fake phase setting).
test('save progress persists across reload', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof window.__aero !== 'undefined', null, { timeout: 20_000 });

  await page.evaluate(() => {
    window.__aero!.markMissionComplete('e2e_mission');
    window.__aero!.saveNow();
  });

  await page.reload();
  await page.waitForFunction(() => typeof window.__aero !== 'undefined', null, { timeout: 20_000 });

  const summary = await page.evaluate(() => window.__aero!.saveSummary());
  expect(summary.missionsCompleted).toBeGreaterThan(0);
  expect(summary.schemaVersion).toBe(4); // bump in lockstep with SAVE_VERSION (was stale at 2)
});
