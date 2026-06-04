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

    // 3. Check Consent Mode defaults are denied
    const consent = await page.evaluate(() => {
      const dl = window.dataLayer || [];
      // Find the most recent consent/default entry
      let latestConsent = null;
      for (const item of dl) {
        if (item[0] === 'consent' && item[1] === 'default') {
          latestConsent = item[2];
        }
      }
      return latestConsent;
    });

    expect(consent, 'Consent/default entry should exist in dataLayer').not.toBeNull();
    expect(consent['analytics_storage']).toBe('denied');
    expect(consent['ad_storage']).toBe('denied');
    expect(consent['ad_user_data']).toBe('denied');
    expect(consent['ad_personalization']).toBe('denied');

    // 4. Ensure wrong GA4 ID G-HW65YS8115 is NOT present anywhere in page source
    const bodyHTML = await page.content();
    expect(bodyHTML).not.toContain('G-HW65YS8115');

    // 5. Check for expected ecommerce events (if defined)
    if (pageInfo.expectEvent) {
      const hasEvent = await page.evaluate((eventName) => {
        const dl = window.dataLayer || [];
        return dl.some(item => item.event === eventName);
      }, pageInfo.expectEvent);
      expect(hasEvent, `dataLayer should contain event "${pageInfo.expectEvent}"`).toBe(true);
    }

    // 6. Ensure direct gtag.js config calls with G-KDMZ8KZC3F are present for reliability
    const inlineScriptsDirect = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script:not([src])')).map(s => s.textContent);
    });
    const hasDirectGtagConfig = inlineScriptsDirect.some(text =>
      text.includes("gtag('config', 'G-KDMZ8KZC3F'") || 
      text.includes('gtag("config", "G-KDMZ8KZC3F"')
    );
    expect(hasDirectGtagConfig, 'Inline script should contain gtag("config", "G-KDMZ8KZC3F", ...)').toBe(true);
  });
}
