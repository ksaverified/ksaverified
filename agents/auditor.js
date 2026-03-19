const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Auditor Agent
 * Performs visual and structural audits on generated websites using Puppeteer.
 */
class AuditorAgent {
  constructor() {
    this.screenshotDir = path.join(__dirname, '../temp/screenshots');
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  /**
   * Performs a visual audit of the provided HTML
   * @param {string} html - The HTML content to audit
   * @param {string} fileName - Base filename for screenshots
   * @returns {Promise<Object>} Audit report with findings
   */
  async audit(html, fileName = 'audit') {
    console.log(`[Auditor] Starting visual audit for ${fileName}...`);
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      // Set viewport for a common desktop size
      await page.setViewport({ width: 1440, height: 900 });
      
      // Load HTML (using data URI for fast local rendering)
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const findings = {
        brokenImages: [],
        layoutIssues: [],
        accessibilityWarnings: [],
        screenshots: {}
      };

      // 1. Check for broken images
      findings.brokenImages = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).filter(img => {
          return !img.complete || img.naturalWidth === 0;
        }).map(img => img.src);
      });

      // 2. Check for overlapping elements (Basic check)
      findings.layoutIssues = await page.evaluate(() => {
        const issues = [];
        const elements = Array.from(document.querySelectorAll('div, section, header, footer'));
        
        // Check for overflow-x (horizontal scroll on mobile is a common issue)
        if (document.documentElement.scrollWidth > window.innerWidth) {
          issues.push('Horizontal scroll detected (Layout break on current viewport)');
        }
        
        return issues;
      });

      // 3. Accessibility / Best Practice check
      findings.accessibilityWarnings = await page.evaluate(() => {
        const warnings = [];
        if (!document.querySelector('h1')) warnings.push('Missing H1 header');
        if (Array.from(document.querySelectorAll('img')).some(img => !img.alt)) {
          warnings.push('Images missing alt text');
        }
        return warnings;
      });

      // 4. Capture screenshots (Desktop + Mobile)
      const desktopPath = path.join(this.screenshotDir, `${fileName}_desktop.png`);
      await page.screenshot({ path: desktopPath, fullPage: true });
      findings.screenshots.desktop = desktopPath;

      await page.setViewport({ width: 375, height: 812, isMobile: true });
      const mobilePath = path.join(this.screenshotDir, `${fileName}_mobile.png`);
      await page.screenshot({ path: mobilePath, fullPage: true });
      findings.screenshots.mobile = mobilePath;

      console.log(`[Auditor] Audit complete. Found ${findings.brokenImages.length} broken images and ${findings.layoutIssues.length} layout issues.`);
      return findings;
    } catch (error) {
      console.error(`[Auditor] Audit failed: ${error.message}`);
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }
}

module.exports = AuditorAgent;
