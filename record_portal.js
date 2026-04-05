const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'marketing_screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const BASE_URL = 'http://localhost:5173/customers';
const PHONE = '966599999999';
const PIN = '123456';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function screenshot(page, name) {
  const file = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`📸 Screenshot saved: ${name}.png`);
  return file;
}

(async () => {
  console.log('\n🎬 Starting KSA Verified Client Portal Marketing Walkthrough\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: ['--window-size=1400,900']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    recordVideo: {
      dir: path.join(__dirname, 'marketing_screenshots'),
      size: { width: 1400, height: 900 }
    }
  });

  const page = await context.newPage();

  // ── STEP 1: Login Page ──────────────────────────────────────────
  console.log('→ Navigating to login page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await wait(2000);
  await screenshot(page, '01_login_page');

  // ── STEP 2: Enter Phone Number ──────────────────────────────────
  console.log('→ Entering phone number...');
  const phoneInput = await page.locator('input[type="tel"], input[type="text"], input[placeholder*="phone"], input[placeholder*="Phone"], input[placeholder*="966"], input').first();
  await phoneInput.click();
  await phoneInput.fill(PHONE);
  await wait(500);
  await screenshot(page, '02_phone_entered');

  // ── STEP 3: Click Send Code ─────────────────────────────────────
  console.log('→ Clicking Send Login Code button...');
  const sendBtn = await page.locator('button[type="submit"]').first();
  await sendBtn.click();
  await wait(3000);
  await screenshot(page, '03_after_send_code');

  // ── STEP 4: Enter PIN ───────────────────────────────────────────
  console.log('→ Entering PIN...');
  const pinInput = await page.locator('input[maxLength="6"], input[placeholder="••••••"]').first();
  await pinInput.click();
  await pinInput.fill(PIN);
  await wait(500);
  await screenshot(page, '04_pin_entered');

  // ── STEP 5: Verify Code ─────────────────────────────────────────
  console.log('→ Clicking Verify Code button...');
  const verifyBtn = await page.locator('button[type="submit"]').first();
  await verifyBtn.click();
  await wait(4000);
  await screenshot(page, '05_dashboard_loaded');

  // ── STEP 6: Dashboard scroll ────────────────────────────────────
  console.log('→ Exploring dashboard...');
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
  await wait(2000);
  await screenshot(page, '06_dashboard_scrolled');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(1000);

  // ── STEP 7: My Website ──────────────────────────────────────────
  console.log('→ Navigating to My Website...');
  await page.goto(`${BASE_URL}/my-website`, { waitUntil: 'domcontentloaded' });
  await wait(4000);
  await screenshot(page, '07_my_website');
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
  await wait(2000);
  await screenshot(page, '08_my_website_scrolled');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(1000);

  // ── STEP 8: SEO Hub ─────────────────────────────────────────────
  console.log('→ Navigating to SEO Hub / Gap Audit...');
  await page.goto(`${BASE_URL}/seo-hub`, { waitUntil: 'domcontentloaded' });
  await wait(4000);
  await screenshot(page, '09_seo_hub');
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
  await wait(2000);
  await screenshot(page, '10_seo_hub_scrolled');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(1000);

  // ── STEP 9: Profile ─────────────────────────────────────────────
  console.log('→ Navigating to Profile...');
  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
  await wait(3000);
  await screenshot(page, '11_profile');
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
  await wait(2000);
  await screenshot(page, '12_profile_scrolled');

  // ── DONE ──────────────────────────────────────────────────────────
  console.log('\n✅ Walkthrough complete! Closing video...');
  await wait(2000);
  await context.close(); // Saves video
  await browser.close();

  // Report saved files
  const files = fs.readdirSync(SCREENSHOTS_DIR);
  console.log(`\n📁 Marketing assets saved to: ${SCREENSHOTS_DIR}`);
  files.forEach(f => console.log(`  • ${f}`));
})();
