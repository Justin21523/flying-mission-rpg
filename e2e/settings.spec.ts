import { test, expect } from '@playwright/test';

// Batch 13 — settings persist across a reload (the settings stores own their localStorage; the save snapshot
// mirrors them). Driven through the debug bridge so the test doesn't depend on in-scene settings UI.
test('graphics + audio settings persist across reload', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof window.__aero !== 'undefined', null, { timeout: 20_000 });

  await page.evaluate(() => { window.__aero!.setQualityTier('ultra'); window.__aero!.setMasterVolume(0.25); });

  await page.reload();
  await page.waitForFunction(() => typeof window.__aero !== 'undefined', null, { timeout: 20_000 });

  const tier = await page.evaluate(() => window.__aero!.getQualityTier());
  const vol = await page.evaluate(() => window.__aero!.getMasterVolume());
  expect(tier).toBe('ultra');
  expect(vol).toBeCloseTo(0.25, 2);
});
