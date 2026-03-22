const axios = require('axios');
require('dotenv').config();

/**
 * Retoucher Agent
 * Acts as an aesthetic auditor and quality controller.
 * Migrated to OpenRouter to support advanced Vision models for UI/UX audits.
 */
class RetoucherAgent {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
        this.pexelsKey = process.env.PEXELS_API_KEY;
        
        if (!this.apiKey) {
            throw new Error('OPENROUTER_API_KEY is not defined in environment variables.');
        }
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
            console.log(`[Retoucher] Fetching Pexels photos for: ${query}...`);
            // Increased to 40 for much better variety and to avoid duplicates on large pages
            const res = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=40&orientation=landscape`, {
                headers: { Authorization: this.pexelsKey }
            });
            
            if (res.data && res.data.photos) {
                // Shuffle the photos to ensure different sites for the same category look unique
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
     * Refines and polishes the raw HTML using targeted edits.
     * @param {string} rawHtml - The HTML string
     * @param {Object} business - The business details
     * @param {string[]} [photos] - Real photos from Google Maps
     * @returns {Promise<string>} Polished HTML string
     */
    async retouchWebsite(rawHtml, business, photos = []) {
        console.log(`[Retoucher] Auditing website for: ${business.name} with ${photos.length} real photos...`);

        // PHASE 1: Programmatic Purge (Deterministic)
        // LLMs struggle with exact string replacement of 800-character URLs. We do it via Regex first.
        let cleanedHtml = rawHtml;
        
        // PHASE 1: Programmatic Purge (Deterministic)
        // Select images dynamically using a fast LLM request to get the best Pexels search term
        let searchQuery = 'local business';
        try {
            const pexelsPrompt = `Analyze this business name and types, and reply with EXACTLY 1 OR 2 ENGLISH WORDS best describing their core visual product or service for a stock photo search.
Example 1: Name: "Pizza Bar IOI", Types: "restaurant, food" -> "pizza"
Example 2: Name: "Elite Dental", Types: "health, dentist" -> "dentist clinic"
Example 3: Name: "Super Car Wash", Types: "car_repair" -> "car wash"
Business Name: "${business.name}"
Business Types: "${(business.types || []).join(', ')}"
Output ONLY the 1-2 words in English, nothing else, no quotes.`;

            const queryRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: this.model,
                messages: [{ role: 'user', content: pexelsPrompt }],
                temperature: 0.1
            }, {
                headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
                timeout: 5000
            });
            const suggestedQuery = queryRes.data.choices[0].message.content.trim().replace(/['"]/g, '');
            if (suggestedQuery && suggestedQuery.length < 30) {
                searchQuery = suggestedQuery;
            }
        } catch (e) {
            console.warn('[Retoucher] Failed to generate dynamic Pexels query, falling back to local business:', e.message);
        }

        // Fetch dynamic images from Pexels
        let businessImages = await this.fetchPexelsPhotos(searchQuery);

        // Fallback to high-quality abstract / corporate / local business if Pexels fails or returns empty
        if (businessImages.length === 0) {
            businessImages = [
                "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop", // Office
                "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop", // Team
                "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1000&auto=format&fit=crop", // Service
                "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop"  // Planning
            ];
        }

        let imgIndex = 0;
        const getNextImage = () => businessImages[imgIndex++ % businessImages.length];

        // 0. Inject Mobile Logic Styles & Scripts
        const mobileStyles = `
        /* Global language toggle visibility */
        html[lang="ar"] .lang-en, html[lang="ar"] [data-lang="en"] { display: none !important; }
        html[lang="en"] .lang-ar, html[lang="en"] [data-lang="ar"] { display: none !important; }

        /* Mobile-only language toggle: show only the other language */
        @media (max-width: 768px) {
            html[lang="en"] .lang-en-btn { display: none !important; }
            html[lang="ar"] .lang-ar-btn { display: none !important; }
        }
        .mobile-menu-active {  
            display: flex !important; 
            flex-direction: column !important; 
            align-items: center !important; 
            justify-content: center !important; 
            position: fixed !important; 
            inset: 0 !important; 
            width: 100% !important; 
            height: 100vh !important; 
            background: rgba(17, 24, 39, 0.98) !important; 
            z-index: 100 !important; 
        }
        .mobile-menu-active li, .mobile-menu-active a {
            margin: 1.5rem 0 !important;
            font-size: 2.25rem !important; /* text-4xl */
            font-weight: 700 !important;
            text-align: center !important;
            display: block !important;
        }
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
                    // Close menu when a link is clicked
                    menu.querySelectorAll('a').forEach(link => {
                        link.addEventListener('click', () => {
                            if (menu.classList.contains('mobile-menu-active')) {
                                toggleMenu();
                            }
                        });
                    });
                }
            });
        </script>
        `;

        // Inject CSS (Cleanup old versions first to allow updates)
        // Match both the new multi-line version and the old single-line version
        cleanedHtml = cleanedHtml.replace(/\/\* Global language toggle visibility \*\/[\s\S]*?#mobile-menu-btn \{[^\}]*\}(?:\s*)?/g, '');
        cleanedHtml = cleanedHtml.replace(/\/\* Mobile-only language toggle[\s\S]*?#mobile-menu-btn \{[^\}]*\}(?:\s*)?/g, '');
        cleanedHtml = cleanedHtml.replace(/\.mobile-menu-active \{ display: flex !important; flex-direction: column;[\s\S]*? \}(?:\s*)?/g, '');
        cleanedHtml = cleanedHtml.replace('</style>', `${mobileStyles}\n    </style>`);

        // Inject JS (Cleanup old versions first)
        // Match various versions of the mobile menu script
        cleanedHtml = cleanedHtml.replace(/<script>\s*document\.addEventListener\('DOMContentLoaded', \(\) => \{\s*const menuBtn = document\.getElementById\('mobile-menu-btn'\);[\s\S]*?<\/script>\s*\n/g, '');
        cleanedHtml = cleanedHtml.replace('</body>', `${mobileScript}\n</body>`);

        // 1. Purge all Google Maps photos (they render as Red X due to billing)
        cleanedHtml = cleanedHtml.replace(/https:\/\/maps\.googleapis\.com\/maps\/api\/place\/photo\?[^"'\s)]+/g, () => getNextImage());
        
        // 2. Purge all loremflickr placeholders (often fetch irrelevant cats/statues)
        cleanedHtml = cleanedHtml.replace(/https:\/\/loremflickr\.com\/[^"'\s)]+/g, () => getNextImage());

        // 3. Purge all existing Unsplash images to guarantee a completely fresh, unbroken, and unique set.
        // This solves the missing hero image bug and the duplicate image bugs.
        cleanedHtml = cleanedHtml.replace(/https:\/\/images\.unsplash\.com\/photo-[^"'\s)]+/g, () => getNextImage());

        // 4. Programmatic Structural Cleanup & Header Enforcement
        // Identify the brand name and remove image logos
        let brandNameEn = business.name || 'Brand';
        let brandNameAr = business.name || 'العلامة التجارية';

        // Enforce solid black premium header
        const premiumHeader = `
    <!-- Header -->
    <header class="sticky top-0 w-full z-50 bg-black text-white shadow-2xl flex justify-between items-center px-6 py-4">
        <!-- Logo/Brand -->
        <a href="#home" class="flex items-center space-x-2 rtl:space-x-reverse">
            <span class="text-3xl font-extrabold tracking-tight text-white hover:text-primary-light transition-colors">
                <span data-lang="en">${brandNameEn}</span>
                <span data-lang="ar">${brandNameAr}</span>
            </span>
        </a>

        <!-- Desktop Navigation -->
        <nav id="desktop-nav" class="hidden md:flex space-x-6 lg:space-x-8 text-lg ml-auto mr-8">
            <a href="#home" class="hover:text-primary-light transition-colors duration-200"><span data-lang="en">Home</span><span data-lang="ar">الرئيسية</span></a>
            <a href="#about" class="hover:text-primary-light transition-colors duration-200"><span data-lang="en">About</span><span data-lang="ar">من نحن</span></a>
            <a href="#services" class="hover:text-primary-light transition-colors duration-200"><span data-lang="en">Services</span><span data-lang="ar">الخدمات</span></a>
            <a href="#contact" class="hover:text-primary-light transition-colors duration-200"><span data-lang="en">Contact</span><span data-lang="ar">اتصل بنا</span></a>
        </nav>

        <!-- Dynamic Controls -->
        <div class="flex items-center space-x-4 md:space-x-6 rtl:space-x-reverse">
            <button onclick="toggleLanguage()" class="lang-en-btn text-white hover:text-primary-light font-bold hidden md:block">EN</button>
            <button onclick="toggleLanguage()" class="lang-ar-btn text-white hover:text-primary-light font-bold hidden md:block">عربي</button>
            
            <div class="md:hidden flex items-center">
                <input type="checkbox" id="mobile-menu-toggle" class="hidden peer">
                <label for="mobile-menu-toggle" class="cursor-pointer text-white text-3xl peer-checked:text-primary-light transition-colors duration-200">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path class="hidden peer-checked:block" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        <path class="block peer-checked:hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </label>
            </div>
        </div>
    </header>
        `;

        // Strip ALL existing headers and mobile nav controls robustly
        cleanedHtml = cleanedHtml.replace(/<!-- Header -->\s*<header[^>]*>[\s\S]*?<\/header>/gi, '');
        cleanedHtml = cleanedHtml.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
        cleanedHtml = cleanedHtml.replace(/<div class="mobile-nav-menu[\s\S]*?<\/div>\s*<\/div>/gi, '');
        cleanedHtml = cleanedHtml.replace(/<button id="mobile-menu-btn"[\s\S]*?<\/button>/gi, '');
        cleanedHtml = cleanedHtml.replace(/<label for="mobile-menu-toggle"[^>]*>[\s\S]*?<\/label>/gi, '');
        cleanedHtml = cleanedHtml.replace(/<div class="overlay[^>]*>[\s\S]*?<\/div>/gi, '');
        
        // Remove orphand residuals like "s=overlay"
        cleanedHtml = cleanedHtml.replace(/s="overlay"[^>]*><\/label>/gi, '');
        cleanedHtml = cleanedHtml.replace(/<button[^>]*mobile-menu-btn[^>]*>[\s\S]*?<\/button>/gi, '');

        // Inject our new consolidated header after <body> starts
        cleanedHtml = cleanedHtml.replace(/<body[^>]*>/, (match) => match + '\n' + premiumHeader);

        // Cleanup double header tags just in case
        cleanedHtml = cleanedHtml.replace(/<\/header>\s*<\/header>/g, '</header>');


        // Removed redundant injections as they are now consolidated in the premiumHeader above.


        // PHASE 2: AI Aesthetic Polish
        const systemPrompt = `You are a world-class UI/UX Designer and Frontend Auditor.
Your job is to audit HTML/Tailwind code to ensure extremely high aesthetic quality and professional "premium" feel.

CRITICAL AESTHETIC RULES:
1. **SIDEBAR LANGUAGE SWITCHER**: Keep the language buttons (EN / عربي) INSIDE the mobile navigation menu ('#mobile-menu') and desktop header. 
2. **LAYOUT & SPACING**: Ensure generous white space (use p-8, py-20, gap-12). All sections MUST have consistent vertical spacing.
3. **TYPOGRAPHY**: Ensure text contrast is perfect. Use 'tracking-tight' for headers and 'leading-relaxed' for body text.
4. **GLASSMORPHISM**: Use 'backdrop-blur-xl' and 'bg-white/10' or 'bg-black/40' for modern, sleek cards. Add subtle borders: 'border border-white/10'.
5. **COLOR HARMONY**: Stick to a premium palette. If the business is luxury, use golds/blacks. If tech, use deep blues/slates.
6. **INTERACTIONS**: Add hover effects to all buttons (e.g., 'hover:scale-105 transition-transform', 'hover:shadow-2xl').
7. **FOOTER**: Ensure the footer is elegant, with clear links and social placeholders.
8. **DO NOT MODIFY** the '#mobile-menu' logic or the main header structure we just injected. Focus on refining the INNER content of the sections.

BUSINESS CONTEXT:
${business.name} operates in: ${(business.types || []).join(', ')}.

OUTPUT FORMAT:
Return ONLY a valid JSON array of edits. No markdown.
[
  { "old": "exact_html_string_to_find", "new": "improved_html_string_to_replace_it" }
]`;

        const userPrompt = `
HTML to Audit:
${cleanedHtml.substring(0, 15000)}
`;

        try {
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: 'json_object' }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 50000 
            });

            const content = response.data.choices[0].message.content;
            
            // Extract the array from the JSON object if the model wrapped it
            const parsed = typeof content === 'string' ? JSON.parse(content) : content;
            const edits = Array.isArray(parsed) ? parsed : (parsed.edits || Object.values(parsed)[0]);

            console.log(`[Retoucher] Received ${Array.isArray(edits) ? edits.length : 'invalid'} AI edits.`);

            if (!Array.isArray(edits)) {
                console.warn("[Retoucher] Model didn't return an array. Skipping aesthetic enhancements.");
                return cleanedHtml; // Return the regex-cleaned version if AI edits are invalid
            }

            let finalHtml = cleanedHtml;
            for (const edit of edits) {
                if (edit.old && edit.new) {
                    // Using split/join for global replace of exact strings safely
                    finalHtml = finalHtml.split(edit.old).join(edit.new);
                }
            }

            return finalHtml;
        } catch (error) {
            console.error(`[Retoucher] Audit failed: ${error.message}`);
            return cleanedHtml; // Return at least the regex-cleaned version
        }
    }
}

module.exports = RetoucherAgent;
