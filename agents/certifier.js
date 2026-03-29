const puppeteer = require('puppeteer');
const { generateText } = require('../services/ai');

/**
 * CertifierAgent
 * 
 * A deep quality gate that must pass before ANY customer contact.
 * Checks HTML content, bilingual text, images, layout, and sections.
 * Sets `is_certified = true` in the DB when all checks pass.
 * 
 * This is STRICTER than the AuditorAgent (which checks live URLs).
 * CertifierAgent checks the HTML content itself before publishing,
 * and re-checks live sites before retargeting.
 */
class CertifierAgent {
    constructor() {
        this.minHtmlLength = 5000; // Minimum characters for a real page
        this.requiredSections = ['#services', '#contact']; // Sections that must exist
    }

    /**
     * Certify an HTML string (before publishing)
     * @param {string} html - The raw HTML content
     * @param {Object} business - Business details for context
     * @returns {Promise<Object>} { passed, score, issues, report }
     */
    async certifyHtml(html, business) {
        console.log(`[Certifier] Running HTML certification for: ${business.name}`);
        const issues = [];
        let score = 100;

        // CHECK 1: Minimum content length
        if (!html || html.length < this.minHtmlLength) {
            issues.push(`HTML too short: ${html?.length || 0} chars (min: ${this.minHtmlLength})`);
            score -= 40;
        }

        // CHECK 2: No leftover semantic placeholders
        const remainingPlaceholders = (html || '').match(/GPHOTO_[A-Z_0-9]+/g);
        if (remainingPlaceholders && remainingPlaceholders.length > 0) {
            issues.push(`Unresolved image placeholders: ${[...new Set(remainingPlaceholders)].join(', ')}`);
            score -= 30;
        }

        // CHECK 3: Bilingual content (Arabic text present)
        const hasArabic = /[\u0600-\u06FF]/.test(html || '');
        if (!hasArabic) {
            issues.push('No Arabic text detected. Site is not bilingual.');
            score -= 20;
        }

        // CHECK 4: English content present
        const hasEnglish = /[a-zA-Z]{5,}/.test(html || '');
        if (!hasEnglish) {
            issues.push('No English text detected.');
            score -= 10;
        }

        // CHECK 5: Has real images (not just placeholders or empty src)
        const imgSrcMatches = (html || '').match(/src=["'](https?:\/\/[^"']+)["']/g) || [];
        const realImages = imgSrcMatches.filter(src =>
            !src.includes('GPHOTO') &&
            !src.includes('placeholder') &&
            !src.includes('data:')
        );
        if (realImages.length < 2) {
            issues.push(`Too few real images found: ${realImages.length} (min: 2)`);
            score -= 20;
        }

        // CHECK 6: Has a contact section
        const hasContact = /<[^>]+id=["']contact["']/i.test(html || '') ||
            /<[^>]+id=["']اتصل["']/i.test(html || '');
        if (!hasContact) {
            issues.push('Missing #contact section (required for lead capture).');
            score -= 15;
        }

        // CHECK 7: Has a services section
        const hasServices = /<[^>]+id=["']services["']/i.test(html || '') ||
            /<[^>]+id=["']الخدمات["']/i.test(html || '');
        if (!hasServices) {
            issues.push('Missing #services section.');
            score -= 10;
        }

        // CHECK 8: Has phone number
        const hasPhone = (business.phone || '').replace(/\D/g, '').length > 8 &&
            (html || '').includes((business.phone || '').replace(/\D/g, '').slice(-8));
        if (!hasPhone) {
            issues.push('Business phone number not found in HTML.');
            score -= 5;
        }

        score = Math.max(0, score);
        const passed = score >= 70 && !issues.some(i => i.includes('placeholders'));

        console.log(`[Certifier] HTML check: ${passed ? '✅ PASSED' : '❌ FAILED'} (${score}/100). Issues: ${issues.length}`);
        return {
            passed,
            score,
            issues,
            report: {
                type: 'html_check',
                score,
                issues,
                imageCount: realImages.length,
                hasArabic,
                hasContact,
                hasServices,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Certify a live URL (after publishing, before retargeting)
     * Uses Puppeteer for a real browser check.
     * @param {string} url - The live Vercel URL
     * @param {string} slug - For logging
     * @returns {Promise<Object>} { passed, score, issues, report }
     */
    async certifyUrl(url, slug = 'unknown') {
        console.log(`[Certifier] Running live URL certification for: ${url}`);
        const issues = [];
        let score = 100;

        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
            const page = await browser.newPage();
            await page.setViewport({ width: 1440, height: 900 });

            // Navigate with timeout
            try {
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            } catch (navErr) {
                issues.push(`Page failed to load: ${navErr.message}`);
                return { passed: false, score: 0, issues, report: { type: 'url_check', score: 0, issues } };
            }

            // Wait for images to load
            await new Promise(r => setTimeout(r, 2000));

            const checks = await page.evaluate(() => {
                const results = {};

                // Broken images
                results.brokenImages = Array.from(document.querySelectorAll('img'))
                    .filter(img => {
                        const isContent = img.offsetWidth > 50 && img.offsetHeight > 50;
                        return isContent && (!img.complete || img.naturalWidth === 0);
                    })
                    .map(img => img.src);

                // Duplicate images (same URL used > 1 time)
                const imgCount = {};
                document.querySelectorAll('img').forEach(img => {
                    if (img.src && img.src.startsWith('http')) imgCount[img.src] = (imgCount[img.src] || 0) + 1;
                });
                results.duplicateImages = Object.entries(imgCount)
                    .filter(([, count]) => count > 1)
                    .map(([src, count]) => ({ src: src.substring(0, 60) + '...', count }));

                // Horizontal overflow (layout break)
                results.hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth + 5;

                // Total images on page
                results.totalImages = document.querySelectorAll('img[src^="http"]').length;

                // Has contact section
                results.hasContact = !!(document.getElementById('contact') || document.querySelector('[id*="contact"]'));

                // Has H1
                results.hasH1 = !!document.querySelector('h1');

                // Has phone number pattern
                results.hasPhone = /\+?966|05\d{8}/.test(document.body.innerText);

                // Arabic text present
                results.hasArabic = /[\u0600-\u06FF]/.test(document.body.innerText);

                return results;
            });

            // Score the results
            if (checks.brokenImages.length > 0) {
                const penalty = Math.min(60, checks.brokenImages.length * 20);
                issues.push(`${checks.brokenImages.length} broken image(s)`);
                score -= penalty;
            }

            if (checks.duplicateImages.length > 2) {
                issues.push(`${checks.duplicateImages.length} duplicate images (low visual variety)`);
                score -= 15;
            }

            if (checks.hasHorizontalScroll) {
                issues.push('Horizontal scroll detected (layout break on desktop)');
                score -= 25;
            }

            if (checks.totalImages < 2) {
                issues.push(`Only ${checks.totalImages} images loaded (minimum 2 required)`);
                score -= 20;
            }

            if (!checks.hasContact) {
                issues.push('No contact section found on live page');
                score -= 10;
            }

            if (!checks.hasH1) {
                issues.push('No H1 heading found');
                score -= 5;
            }

            if (!checks.hasPhone) {
                issues.push('Phone number not visible on page');
                score -= 10;
            }

            if (!checks.hasArabic) {
                issues.push('No Arabic text visible on page');
                score -= 15;
            }

            score = Math.max(0, score);
            const passed = score >= 75;

            console.log(`[Certifier] Live URL check: ${passed ? '✅ PASSED' : '❌ FAILED'} (${score}/100)`);
            return {
                passed,
                score,
                issues,
                report: {
                    type: 'url_check',
                    score,
                    issues,
                    checks,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (err) {
            console.error(`[Certifier] Puppeteer error: ${err.message}`);
            return {
                passed: false,
                score: 0,
                issues: [`Puppeteer error: ${err.message}`],
                report: { type: 'url_check', score: 0, issues: [err.message] }
            };
        } finally {
            if (browser) await browser.close();
        }
    }

    /**
     * Full certification pipeline: HTML + Live URL
     * Returns a unified verdict.
     */
    async certify(lead) {
        const results = { htmlCheck: null, urlCheck: null, passed: false, finalScore: 0, issues: [] };

        // If we have HTML, check it first
        if (lead.website_html && lead.website_html.length > 100) {
            results.htmlCheck = await this.certifyHtml(lead.website_html, lead);
            results.issues.push(...(results.htmlCheck.issues || []));
        }

        // If we have a live URL, check it
        if (lead.vercel_url) {
            results.urlCheck = await this.certifyUrl(lead.vercel_url, lead.slug);
            results.issues.push(...(results.urlCheck.issues || []));

            // Live URL check is authoritative
            results.finalScore = results.urlCheck.score;
            results.passed = results.urlCheck.passed;
        } else if (results.htmlCheck) {
            results.finalScore = results.htmlCheck.score;
            results.passed = results.htmlCheck.passed;
        }

        return results;
    }
}

module.exports = CertifierAgent;
