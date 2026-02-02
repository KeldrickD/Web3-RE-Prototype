const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  // Dashboard / default landing page
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'dashboard.png', fullPage: true });

  // Listcoin page
  await page.goto('http://localhost:3000/listcoin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'listcoin.png', fullPage: true });

  await browser.close();
})();
