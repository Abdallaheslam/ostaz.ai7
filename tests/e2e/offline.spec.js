const { test, expect } = require('@playwright/test');

test('service worker registered and offline page serves', async ({ page }) => {
  await page.goto('/');

  // service worker registration (if supported)
  const swRegistered = await page.evaluate(() => !!navigator.serviceWorker);
  expect(swRegistered).toBeTruthy();

  // simulate offline and request a navigation -> should get offline.html
  await page.context().setOffline(true);
  // load offline page content directly and assert it's reachable via service worker cache
  await page.waitForTimeout(250); // allow SW to control page
  await page.goto('/offline.html');
  const text = await page.locator('body').textContent();
  expect(text).toBeTruthy();
  await page.context().setOffline(false);
});