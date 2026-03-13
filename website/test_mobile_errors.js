const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 13 Pro']
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', error => {
    errors.push({ type: 'PageError', url: page.url(), message: error.message });
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      // Filter out harmless messages
      if (!msg.text().includes('favicon.ico')) {
          errors.push({ type: 'ConsoleError', url: page.url(), message: msg.text() });
      }
    }
  });

  const urls = [
    'http://localhost:3000',
    'http://localhost:3000/products.html'
  ];

  for (const url of urls) {
    try {
      console.log(`Visiting ${url} on mobile...`);
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      
      // Attempt some mobile actions like opening the menu
      try {
          const mobileToggle = await page.$('.mobile-toggle');
          if (mobileToggle) {
              await mobileToggle.click();
              await page.waitForTimeout(300);
          }
      } catch(e) {}

    } catch (e) {
      errors.push({ type: 'NavigationError', url, message: e.message });
    }
  }

  console.log('\n--- MOBILE ERROR REPORT ---');
  if (errors.length === 0) {
    console.log('No significant errors found in mobile loads.');
  } else {
    for (const err of errors) {
      console.log(`[${err.type}] ${err.url}: ${err.message}`);
    }
  }

  await browser.close();
})();
