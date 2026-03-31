const axios = require('axios');
const { generateText } = require('../services/ai');
require('dotenv').config();

/**
 * Retoucher Agent
 * Acts as an aesthetic auditor and quality controller. 
 * Resolves image placeholders with high-quality Pexels photos or real business photos.
 */
class RetoucherAgent {
    constructor() {
        this.pexelsKey = process.env.PEXELS_API_KEY;
    }

    /**
     * Helper to fetch high-quality images from Pexels based on category
     * @param {string} query - Search term
     * @returns {Promise<string[]>} Array of image URLs
     */
    async fetchPexelsPhotos(query) {
        if (!this.pexelsKey) {
            console.warn('[Retoucher] PEXELS_API_KEY missing - using fallback placeholders.');
            return [];
        }
        
        try {
            console.log(`[Retoucher] Fetching Pexels photos for query: "${query}"...`);
            const res = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=40&orientation=landscape`, {
                headers: { Authorization: this.pexelsKey }
            });
            
            if (res.data && res.data.photos) {
                // Return randomized URLs to ensure variety across different sites
                return res.data.photos
                    .map(p => p.src.large2x || p.src.large)
                    .sort(() => Math.random() - 0.5);
            }
            return [];
        } catch (e) {
            console.error('[Retoucher] Pexels API Error:', e.message);
            return [];
        }
    }

    /**
     * Refines and polishes the raw HTML using targeted edits and image resolution.
     * @param {string} rawHtml - The HTML string
     * @param {Object} business - The business details
     * @param {string[]} [photos] - Real photos from Google/Place APIs
     * @returns {Promise<string>} Polished HTML string
     */
    async retouchWebsite(rawHtml, business, photos = []) {
        console.log(`[Retoucher] Auditing website for: ${business.name} with ${photos.length} real photos...`);

        let cleanedHtml = rawHtml;
        const realPhotos = photos || business.photos || [];

        // PHASE 1: Identify all semantic placeholders (e.g., GPHOTO_HERO, GPHOTO_SERVICE_1)
        const placeholderRegex = /GPHOTO_[A-Z0-9_]+/g;
        const matched = cleanedHtml.match(placeholderRegex);
        const foundPlaceholders = matched ? [...new Set(matched)] : [];
        console.log(`[Retoucher] Found semantic placeholders: ${foundPlaceholders.join(', ')}`);

        // PHASE 2: Generate specialized queries for each unique placeholder
        const placeholderMappings = {};
        const queryPromises = foundPlaceholders.map(async (tag) => {
            // Skip numeric aliases if they were used directly (legacy/real photo support)
            if (/GPHOTO_\d+$/.test(tag)) return;

            try {
                const tagPurpose = tag.replace('GPHOTO_', '').toLowerCase().replace(/_/g, ' ');
                const pexelsPrompt = `As an image curator, generate a concise English Pexels search query (exactly 2-3 words) for a "${tagPurpose}" image for a business.
Business Name: "${business.name}"
Business Categories: ${(business.types || []).join(', ')}
Goal: Premium, high-quality aesthetics.
Note: The business name might be in Arabic, but the Pexels query MUST be in English.
Output ONLY the 2-3 word English query. NO preamble, NO characters/quotes.`;

                const suggestedQuery = await generateText(pexelsPrompt, { temperature: 0.1, maxOutputTokens: 1024 });
                let finalQuery = suggestedQuery ? suggestedQuery.replace(/```[a-z]*|```|\*\*|['"]/gi, '').trim() : tagPurpose;
                
                // Explicit Localization Injection for key atmosphere tags
                if (['hero', 'interior', 'storefront', 'team'].some(term => tagPurpose.includes(term))) {
                    finalQuery += ' Saudi Arabia Middle East';
                }

                const photos = await this.fetchPexelsPhotos(finalQuery);
                if (photos.length > 0) {
                    placeholderMappings[tag] = photos[0]; // Take the best match
                }
            } catch (e) {
                console.warn(`[Retoucher] Failed to resolve tag ${tag}:`, e.message);
            }
        });

        await Promise.all(queryPromises);
        console.log(`[Retoucher] Mapped ${Object.keys(placeholderMappings).length} placeholders successfully.`);

        // PHASE 3: Fallback & Real Photo Resolution
        // 1. Map explicit numeric aliases GPHOTO_0, GPHOTO_1 etc to real photos
        for (let i = 0; i < realPhotos.length; i++) {
            placeholderMappings[`GPHOTO_${i}`] = realPhotos[i];
        }

        // 2. Intelligently map Real Photos to Semantic Tags if they are still unresolved
        // This ensures GPHOTO_HERO uses a real photo if available, even if the AI used the semantic tag
        if (realPhotos.length > 0) {
            if (!placeholderMappings['GPHOTO_HERO'] && foundPlaceholders.includes('GPHOTO_HERO')) {
                placeholderMappings['GPHOTO_HERO'] = realPhotos[0];
            }
            if (!placeholderMappings['GPHOTO_INTERIOR'] && realPhotos.length > 1 && foundPlaceholders.includes('GPHOTO_INTERIOR')) {
                placeholderMappings['GPHOTO_INTERIOR'] = realPhotos[1];
            }
        }

        // Global fallback query for any remaining unresolved tags
        let globalStock = [];
        const resolveWithGlobal = async () => {
            if (globalStock.length === 0) {
                const globalQuery = `${business.name} ${(business.types || [])[0] || 'business'}`;
                globalStock = await this.fetchPexelsPhotos(globalQuery);
            }
            return globalStock.length > 0 ? globalStock[Math.floor(Math.random() * globalStock.length)] : "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop";
        };

        // PHASE 4: Apply Mapping to HTML
        for (const [tag, url] of Object.entries(placeholderMappings)) {
            cleanedHtml = cleanedHtml.split(tag).join(url);
        }

        // Final generic replacement for anything missed
        const remainingPlaceholders = cleanedHtml.match(placeholderRegex) || [];
        for (const tag of remainingPlaceholders) {
            const fallbackUrl = await resolveWithGlobal();
            cleanedHtml = cleanedHtml.split(tag).join(fallbackUrl);
        }

        // PHASE 5: Purge remaining generic/Maps URLs
        const finalFallback = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop";
        cleanedHtml = cleanedHtml.replace(/https:\/\/(maps\.googleapis\.com\/maps\/api\/place\/photo\?|places\.googleapis\.com\/v1\/places\/[^\/]+\/photos\/)[^"'\s)]+/g, finalFallback);
        cleanedHtml = cleanedHtml.replace(/https:\/\/loremflickr\.com\/[^"'\s)]+/g, finalFallback);
        cleanedHtml = cleanedHtml.replace(/https:\/\/images\.unsplash\.com\/photo-[^"'\s)]+/g, finalFallback);

        // PHASE 5: Premium Header & Navigation Enforcement
        const brandNameEn = business.name || 'Brand';
        const brandNameAr = business.name || 'العلامة التجارية';

        const premiumHeader = `
    <!-- Sticky Header -->
    <header class="sticky top-0 w-full z-50 bg-black text-white shadow-2xl flex justify-between items-center px-6 py-4">
        <a href="#home" class="flex items-center space-x-2 rtl:space-x-reverse">
            <span class="text-3xl font-extrabold tracking-tight text-white">
                <span data-lang="en">${brandNameEn}</span>
                <span data-lang="ar">${brandNameAr}</span>
            </span>
        </a>
        <nav id="desktop-nav" class="hidden md:flex space-x-8 text-lg ml-auto mr-8">
            <a href="#home" class="hover:text-amber-400 transition-colors"><span data-lang="en">Home</span><span data-lang="ar">الرئيسية</span></a>
            <a href="#about" class="hover:text-amber-400 transition-colors"><span data-lang="en">About</span><span data-lang="ar">من نحن</span></a>
            <a href="#services" class="hover:text-amber-400 transition-colors"><span data-lang="en">Services</span><span data-lang="ar">الخدمات</span></a>
            <a href="#contact" class="hover:text-amber-400 transition-colors"><span data-lang="en">Contact</span><span data-lang="ar">اتصل بنا</span></a>
        </nav>
        <div class="flex items-center space-x-4">
            <button onclick="toggleLanguage()" class="lang-en-btn font-bold hidden md:block">EN</button>
            <button onclick="toggleLanguage()" class="lang-ar-btn font-bold hidden md:block">عربي</button>
            <div class="md:hidden">
                <button id="mobile-menu-btn" class="text-white text-3xl">☰</button>
            </div>
        </div>
    </header>
    <div id="mobile-menu" class="hidden">
        <nav class="flex flex-col items-center py-8">
            <a href="#home" class="text-2xl mb-4 text-white"><span data-lang="en">Home</span><span data-lang="ar">الرئيسية</span></a>
            <a href="#about" class="text-2xl mb-4 text-white"><span data-lang="en">About</span><span data-lang="ar">من نحن</span></a>
            <a href="#services" class="text-2xl mb-4 text-white"><span data-lang="en">Services</span><span data-lang="ar">الخدمات</span></a>
            <a href="#contact" class="text-2xl mb-4 text-white"><span data-lang="en">Contact</span><span data-lang="ar">اتصل بنا</span></a>
            <button onclick="toggleLanguage()" class="text-xl text-amber-400 font-bold mt-4">EN / عربي</button>
        </nav>
    </div>`;

        const mobileStyles = `
        html[lang="ar"] .lang-en, html[lang="ar"] [data-lang="en"] { display: none !important; }
        html[lang="en"] .lang-ar, html[lang="en"] [data-lang="ar"] { display: none !important; }
        @media (max-width: 768px) {
            html[lang="en"] .lang-en-btn { display: none !important; }
            html[lang="ar"] .lang-ar-btn { display: none !important; }
        }
        .mobile-menu-active { display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; position: fixed !important; inset: 0 !important; background: rgba(17, 24, 39, 0.98) !important; z-index: 100 !important; }
        .mobile-menu-active a { margin: 1.5rem 0 !important; font-size: 2.25rem !important; font-weight: 700 !important; }
        #mobile-menu-btn { z-index: 101; position: relative; }
        `;

        const mobileScript = `
        <script>
            window.toggleLanguage = function() {
                const html = document.documentElement;
                if (html.lang === 'en') {
                    html.lang = 'ar';
                    html.dir = 'rtl';
                } else {
                    html.lang = 'en';
                    html.dir = 'ltr';
                }
            };
            document.addEventListener('DOMContentLoaded', () => {
                const menuBtn = document.getElementById('mobile-menu-btn');
                const menu = document.getElementById('mobile-menu');
                if (menuBtn && menu) {
                    const toggleMenu = () => {
                        menu.classList.toggle('hidden');
                        menu.classList.toggle('mobile-menu-active');
                        document.body.style.overflow = menu.classList.contains('mobile-menu-active') ? 'hidden' : '';
                    };
                    menuBtn.addEventListener('click', toggleMenu);
                    menu.querySelectorAll('a').forEach(link => {
                        link.addEventListener('click', () => { if (menu.classList.contains('mobile-menu-active')) toggleMenu(); });
                    });
                }
            });
        </script>`;

        // Remove any existing header/nav attempts and inject the premium one
        cleanedHtml = cleanedHtml.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
        cleanedHtml = cleanedHtml.replace(/<body[^>]*>/i, (match) => match + '\n' + premiumHeader);
        
        // Inject styles/scripts
        cleanedHtml = cleanedHtml.replace('</style>', `${mobileStyles}\n</style>`);
        cleanedHtml = cleanedHtml.replace('</body>', `${mobileScript}\n</body>`);

        // PHASE 6: AI Aesthetic Audit
        const systemPrompt = `You are a world-class UI/UX Designer. Audit this HTML for a premium, high-conversion feel.
RULES:
1. Don't touch header/mobile-menu.
2. Ensure generous whitespace (py-20).
3. Use glassmorphism and backdrop-blur.
4. Provide a JSON array of edits: [{ "old": "...", "new": "..." }]`;

        try {
            const auditRes = await generateText(`${systemPrompt}\n\nHTML:\n${cleanedHtml.substring(0, 50000)}`, { temperature: 0.2, maxOutputTokens: 8192, model: 'gemini-1.5-pro' });
            if (auditRes) {
                const jsonMatch = auditRes.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const edits = JSON.parse(jsonMatch[0]);
                    for (const edit of edits) {
                        if (edit.old && edit.new) cleanedHtml = cleanedHtml.split(edit.old).join(edit.new);
                    }
                }
            }
        } catch (e) {
            console.warn('[Retoucher] Audit failed:', e.message);
        }

        // PHASE 7: Final Polarity & Attributes
        if (!cleanedHtml.match(/<html[^>]*lang=/i)) {
            cleanedHtml = cleanedHtml.replace(/<html/i, '<html lang="en" dir="ltr"');
        }
        if (!cleanedHtml.includes('</body>')) cleanedHtml += '\n</body>';
        if (!cleanedHtml.includes('</html>')) cleanedHtml += '\n</html>';

        return cleanedHtml;
    }
}

module.exports = RetoucherAgent;
