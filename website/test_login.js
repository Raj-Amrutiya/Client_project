const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[Browser Error]: ${error.message}`);
  });

  console.log('Visiting register page...');
  await page.goto('http://localhost:3000/register.html', { waitUntil: 'networkidle' });

  await page.fill('input[name="first_name"]', 'New');
  await page.fill('input[name="last_name"]', 'User');
  await page.fill('input[name="email"]', 'newuser4@example.com');
  await page.fill('input[name="password"]', 'Password123!');
  await page.fill('input[name="confirm_password"]', 'Password123!');
  await page.check('input[name="terms"]');
  
  console.log('Clicking register...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  const toasts = await page.evaluate(() => Array.from(document.querySelectorAll('.toast, .toast-message')).map(e => e.textContent));
  console.log('Registration Toasts:', toasts);
  
  const currentUrl = page.url();
  console.log('URL after register:', currentUrl);

  console.log('Visiting login page...');
  await page.goto('http://localhost:3000/login.html', { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', 'newuser4@example.com');
  await page.fill('input[name="password"]', 'Password123!');
  console.log('Clicking login...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
  
  const loginToasts = await page.evaluate(() => Array.from(document.querySelectorAll('.toast, .toast-message')).map(e => e.textContent));
  console.log('Login Toasts:', loginToasts);
  console.log('URL after login:', page.url());
  
  console.log('Done.');
  await browser.close();
})();
