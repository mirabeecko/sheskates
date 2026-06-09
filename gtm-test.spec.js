const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

const pages = [
  { path: '/index.html', name: 'Homepage' },
  { path: '/longboard-kemp-pro-zeny.html', name: 'Longboard Kemp' },
  { path: '/checkout.html', name: 'Checkout', expectEvent: 'begin_checkout' },
  { path: '/thank-you.html', name: 'Thank You' },
  { path: '/dekujeme-longboard-kemp.html', name: 'Dekujeme Kemp', expectEvent: 'purchase' },
  { path: '/thankyou.html', name: 'Thankyou (old)' },
  { path: '/premium_interactive_guide.html', name: 'Premium Guide' },
];

for (const pageInfo of pages) {
  test(`GTM/Consent test: ${pageInfo.name}`, async ({ page }) => {
    // Navigate and wait for network idle so GTM has time to load
    await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle' });

    // 1. Check that GTM container loaded
    const gtmLoaded = await page.evaluate(() => {
      return window.google_tag_manager !== undefined &&
             window.google_tag_manager['GTM-PBHK4JHP'] !== undefined;
    });
    expect(gtmLoaded, 'GTM container GTM-PBHK4JHP should be loaded').toBe(true);

    // 2. Check that dataLayer exists
    const hasDataLayer = await page.evaluate(() => {
      return Array.isArray(window.dataLayer);
    });
    expect(hasDataLayer, 'dataLayer should exist').toBe(true);

    // 3. Ensure wrong GA4 ID G-HW65YS8115 is NOT present anywhere in page source
    const bodyHTML = await page.content();
    expect(bodyHTML).not.toContain('G-HW65YS8115');

    // 4. Ensure direct gtag.js / GA4 / Google Ads IDs are NOT present
    expect(bodyHTML).not.toContain('G-KDMZ8KZC3F');
    expect(bodyHTML).not.toContain('G-V6QK6EWJKR');
    expect(bodyHTML).not.toContain('AW-18191922314');

    // 5. Check for expected ecommerce events (if defined)
    if (pageInfo.expectEvent) {
      const hasEvent = await page.evaluate((eventName) => {
        const dl = window.dataLayer || [];
        return dl.some(item => item.event === eventName);
      }, pageInfo.expectEvent);
      expect(hasEvent, `dataLayer should contain event "${pageInfo.expectEvent}"`).toBe(true);
    }
  });
}
