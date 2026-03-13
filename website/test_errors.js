const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', error => {
    errors.push({ type: 'PageError', url: page.url(), message: error.message });
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({ type: 'ConsoleError', url: page.url(), message: msg.text() });
    }
  });

  const urls = [
    'http://localhost:3000',
    'http://localhost:3000/products.html',
    'http://localhost:3000/login.html',
    'http://localhost:3000/register.html',
    'http://localhost:3000/cart.html',
    'http://localhost:3000/about.html',
    'http://localhost:3000/admin.html'
  ];

  for (const url of urls) {
    try {
      console.log(`Visiting ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
    } catch (e) {
      errors.push({ type: 'NavigationError', url, message: e.message });
    }
  }

  console.log('\\n--- ERROR REPORT ---');
  if (errors.length === 0) {
    console.log('No significant errors found in initial page loads.');
  } else {
    for (const err of errors) {
      // Ignore favicon and image loading errors if irrelevant
      console.log(`[${err.type}] ${err.url}: ${err.message}`);
    }
  }

  await browser.close();
})();
