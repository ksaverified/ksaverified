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
        this.model = process.env.OPENROUTER_MODEL || 'google/gemini-pro-1.5';
        
        if (!this.apiKey) {
            throw new Error('OPENROUTER_API_KEY is not defined in environment variables.');
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
        
        const premiumTechImages = [
            "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=1000&auto=format&fit=crop", // Repair bench
            "https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=1000&auto=format&fit=crop", // Circuit board
            "https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7?q=80&w=1000&auto=format&fit=crop", // Micro soldering
            "https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=1000&auto=format&fit=crop", // Screen repair
            "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?q=80&w=1000&auto=format&fit=crop", // Tech tools
            "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?q=80&w=1000&auto=format&fit=crop", // Motherboard
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop", // Phone repair person
            "https://images.unsplash.com/photo-1574824874457-3fb2d887be17?q=80&w=1000&auto=format&fit=crop", // Broken screen
            "https://images.unsplash.com/photo-1526406915894-7bcd65f60845?q=80&w=1000&auto=format&fit=crop", // Electronics flatlay
            "https://images.unsplash.com/photo-1585247226801-bc613c441316?q=80&w=1000&auto=format&fit=crop"  // Mobile repair
        ];

        let imgIndex = 0;
        const getNextImage = () => premiumTechImages[imgIndex++ % premiumTechImages.length];

        // 1. Purge all Google Maps photos (they render as Red X due to billing)
        cleanedHtml = cleanedHtml.replace(/https:\/\/maps\.googleapis\.com\/maps\/api\/place\/photo\?[^"'\s)]+/g, () => getNextImage());
        
        // 2. Purge all loremflickr placeholders (often fetch irrelevant cats/statues)
        cleanedHtml = cleanedHtml.replace(/https:\/\/loremflickr\.com\/[^"'\s)]+/g, () => getNextImage());

        // 3. Purge all existing Unsplash images to guarantee a completely fresh, unbroken, and unique set.
        // This solves the missing hero image bug and the duplicate image bugs.
        cleanedHtml = cleanedHtml.replace(/https:\/\/images\.unsplash\.com\/photo-[^"'\s)]+/g, () => getNextImage());

        // 4. Programmatic Structural Cleanup (Fixing LLM-induced DOM corruption)
        // Remove duplicate floating language switchers outside the header
        cleanedHtml = cleanedHtml.replace(/<!-- Language Switcher -->[\s\S]*?<div class="z-50 flex space-x-2">[\s\S]*?<\/div>/g, '');
        
        // Convert the remaining fixed switcher inside header into a normal flex item
        cleanedHtml = cleanedHtml.replace(/<div class="fixed top-4 right-4">\s*<div class="\s*flex space-x-2">([\s\S]*?)<\/div>\s*<\/div>/g, '<div class="hidden md:flex items-center space-x-2">$1</div>');
        
        // Cleanup double 'class=' attributes on img tags caused by bad LLM JSON
        cleanedHtml = cleanedHtml.replace(/class="([^"]*)"\s*alt="([^"]*)"\s*class="([^"]*)"/g, 'alt="$2" class="$1 $3"');
        
        // Enforce uniform image heights on all non-hero Unsplash images
        cleanedHtml = cleanedHtml.replace(/<img([^>]*)src="https:\/\/images\.unsplash\.com([^>]*)class="([^"]*)"([^>]*)>/g, (match, p1, p2, classStr, p4) => {
            let cleanClasses = classStr.replace(/h-auto|w-full|h-56|object-cover/g, '').trim();
            return `<img${p1}src="https://images.unsplash.com${p2}class="${cleanClasses} w-full h-56 object-cover"${p4}>`;
        });

        // Clean Hero Button: replace weird SVG or garbage inside the hero button with a clean standard link
        cleanedHtml = cleanedHtml.replace(/<a href="#services"[^>]*>[\s\S]*?<\/a>/, `<a href="#services" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg inline-block text-lg transition-all">
                <span data-lang="en">Explore Our Services</span>
                <span data-lang="ar">اكتشف خدماتنا</span>
            </a>`);

        // Inject Mobile Menu Hamburger if it doesn't already exist
        if (!cleanedHtml.includes('md:hidden')) {
            cleanedHtml = cleanedHtml.replace(/<ul class="flex space-x-6">/g, '<ul class="hidden md:flex space-x-6">');
            cleanedHtml = cleanedHtml.replace(/<\/ul>\s*<\/nav>/g, `</ul>
            <button class="block md:hidden text-white hover:text-blue-400 focus:outline-none">
                <svg class="w-8 h-8 fill-current" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M3 5h18a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm0 6h18a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 011-1zm0 6h18a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 011-1z" clip-rule="evenodd"/>
                </svg>
            </button>
        </nav>`);
        }

        // PHASE 2: AI Aesthetic Polish
        const systemPrompt = `You are a world-class UI/UX Designer and Visual Context Specialist.
Your job is to audit HTML/Tailwind code to ensure high aesthetic quality and premium feel.

CRITICAL UI FIXES & ASSET RULES:
1. **Deduplicate Language Switcher**: There MUST BE EXACTLY ONE language switcher container (the EN / عربي buttons). Find any duplicates and delete them completely. Place the single remaining switcher cleanly INSIDE the sticky '<header>', integrating it into the normal 'flex' layout. REMOVE ALL 'fixed', 'absolute', 'top-4', 'right-4' classes from it so it scrolls naturally with the header and doesn't overlap.
2. **Responsive Mobile Menu**: The main navigation MUST be fully responsive. Hide the main text links on small screens ('hidden md:flex flex-row') and ensure a hamburger menu icon (using a clean SVG) is present and visible ('block md:hidden') for mobile users.
3. **Clean Hero Button**: Strip out ANY broken <svg> tags, blue spherical shapes, or decorative garbage overlapping or sitting directly behind the Hero "Explore" button. The Hero button must be a clean, standard HTML anchor tag styled ONLY with standard Tailwind (e.g. 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg inline-block text-lg transition-all').
4. **Uniform Image Sizes**: Ensure ALL images within grid cards (e.g., the Services section) have perfectly uniform height using exactly these classes: 'h-56 w-full object-cover'.
5. **Glassmorphism & Readability**: Use 'backdrop-blur-lg' and 'bg-white/70' for container cards. Hero section text must have 'drop-shadow-2xl' to remain readable over background images.

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
            let edits = [];
            const parsed = typeof content === 'string' ? JSON.parse(content) : content;
            edits = Array.isArray(parsed) ? parsed : (parsed.edits || Object.values(parsed)[0]);

            if (!Array.isArray(edits)) {
                console.warn("[Retoucher] Model didn't return an array. Skipping.");
                return rawHtml;
            }

            console.log(`[Retoucher] Applying ${edits.length} aesthetic enhancements...`);

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
