const { test, expect } = require('@playwright/test');

test('homepage loads and manifest reachable', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/سوبر ماركت الأستاذ/);

  // manifest.json should be fetchable and contain short_name
  const manifestResp = await page.request.get('/manifest.json');
  expect(manifestResp.status()).toBe(200);
  const manifest = await manifestResp.json();
  expect(manifest.short_name).toBeDefined();

  // offline.html reachable
  const offlineResp = await page.request.get('/offline.html');
  expect(offlineResp.status()).toBe(200);
});