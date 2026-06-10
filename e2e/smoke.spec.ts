import { test, expect } from '@playwright/test';

// Batch 0 smoke test: a fresh load boots the single R3F canvas (the grey-box base scene).
test('homepage mounts the 3D canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
});
