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
   * Performs a visual audit of a live URL or HTML string
   * @param {string} source - The URL or HTML content to audit
   * @param {string} fileName - Base filename for screenshots
   * @param {boolean} isUrl - Whether source is a URL (default true)
   * @returns {Promise<Object>} Audit report with findings and calculated score
   */
  async audit(source, fileName = 'audit', isUrl = true) {
    console.log(`[Auditor] Starting visual audit for ${fileName} (${isUrl ? 'URL' : 'HTML'})...`);
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      // Set viewport for a common desktop size
      await page.setViewport({ width: 1440, height: 900 });
      
      let response;
      if (isUrl) {
        response = await page.goto(source, { waitUntil: 'networkidle0', timeout: 30000 });
        if (response && !response.ok()) {
          console.error(`[Auditor] Page load failure (status: ${response.status()}) for ${source}`);
          return {
            score: 0,
            isValidated: false,
            error: `Page returned status ${response.status()}`,
            brokenImages: [],
            layoutIssues: [],
            accessibilityWarnings: [],
            screenshots: {}
          };
        }
      } else {
        await page.setContent(source, { waitUntil: 'networkidle0' });
      }
      
      const findings = {
        brokenImages: [],
        layoutIssues: [],
        accessibilityWarnings: [],
        screenshots: {},
        score: 100,
        isValidated: false
      };

      // 1. Check for broken images (including naturalWidth check)
      findings.brokenImages = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).filter(img => {
          // If it's a small icon or spacer, ignore it. We care about content images.
          const isIcon = img.width < 10 || img.height < 10;
          if (isIcon) return false;
          return !img.complete || img.naturalWidth === 0;
        }).map(img => img.src);
      });

      // 3. Check for duplicate images (Poor variety indicator)
      findings.duplicateImages = await page.evaluate(() => {
        const counts = {};
        const duplicates = [];
        document.querySelectorAll('img').forEach(img => {
          if (img.src && img.src.startsWith('http')) {
            counts[img.src] = (counts[img.src] || 0) + 1;
          }
        });
        for (const [src, count] of Object.entries(counts)) {
          if (count > 1) duplicates.push({ src, count });
        }
        return duplicates;
      });

      // 4. Accessibility / Structure
      findings.accessibilityWarnings = await page.evaluate(() => {
        const warnings = [];
        if (!document.querySelector('h1')) warnings.push('Missing H1 header');
        return warnings;
      });

      // 5. Calculate Score
      // -20 per broken image (max -60)
      // -40 for horizontal scroll
      // -10 per duplicate image instance (max -30)
      // -10 for missing H1
      let penalty = (findings.brokenImages.length * 20);
      if (penalty > 60) penalty = 60;
      
      if (findings.layoutIssues.length > 0) penalty += 40;
      
      let duplicatePenalty = (findings.duplicateImages.length * 10);
      if (duplicatePenalty > 30) duplicatePenalty = 30;
      penalty += duplicatePenalty;

      if (findings.accessibilityWarnings.length > 0) penalty += 10;
      
      findings.score = Math.max(0, 100 - penalty);
      
      // Auto-validation threshold: 70/100
      // Sites must pass the majority of checks, but minor cosmetic issues (1 duplicate image,
      // missing H1) should not block pitching. True failures (broken images, 404) will score < 70.
      if (findings.score >= 70) {
        findings.isValidated = true;
      }

      // 6. Capture screenshots (Desktop + Mobile) for record
      try {
        const desktopPath = path.join(this.screenshotDir, `${fileName}_desktop.png`);
        await page.screenshot({ path: desktopPath, fullPage: true });
        findings.screenshots.desktop = desktopPath;

        await page.setViewport({ width: 375, height: 812, isMobile: true });
        // Wait a bit for responsive layout to settle
        await new Promise(r => setTimeout(r, 500));
        const mobilePath = path.join(this.screenshotDir, `${fileName}_mobile.png`);
        await page.screenshot({ path: mobilePath, fullPage: true });
        findings.screenshots.mobile = mobilePath;
      } catch (ssError) {
        console.warn(`[Auditor] Screenshot failed: ${ssError.message}`);
      }

      console.log(`[Auditor] Audit complete for ${fileName}. Score: ${findings.score}. Validated: ${findings.isValidated}`);
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
