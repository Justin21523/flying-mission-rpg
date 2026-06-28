import { test, expect } from '@playwright/test';

// Content-fill — guard the new Wave 3/4/5 UI panels (Mission Control Leaderboard, Character Selection
// Equipment Mods / Codex) against the zustand "selector returns a new []/{} each render" infinite-loop bug.
// That bug shows up ONLY at runtime (not in unit tests) as a pageerror / "Maximum update depth exceeded".
const fatal = /Maximum update depth|getSnapshot should be cached|infinite loop/i;
// Benign headless WebGL/asset noise — not real code errors.
const benign = /GLTFLoader|THREE\.|Couldn't load texture|deprecated|WebGL/i;

test('new UI panels mount without a render loop', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' && !benign.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => { if (!benign.test(e.message)) errors.push(e.message); });

  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await page.waitForFunction(() => typeof window.__aero !== 'undefined', null, { timeout: 20_000 });

  // Mount each screen that carries a new panel; settle a few frames so any render loop would trip.
  for (const phase of ['MISSION_CONTROL', 'CHARACTER_SELECTION']) {
    await page.evaluate((p) => window.__aero!.jumpTo(p), phase);
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => window.__aero!.phase())).toBe(phase);
  }

  const fatals = errors.filter((e) => fatal.test(e));
  expect(fatals, `render-loop errors:\n${fatals.join('\n')}`).toEqual([]);
  // No uncaught errors of any kind beyond the benign filter.
  expect(errors, `console/page errors:\n${errors.join('\n')}`).toEqual([]);
});
