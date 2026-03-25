const { generateText } = require('../services/ai');

/**
 * Creator Agent
 * Generates a complete, single-file HTML website using Gemini AI directly.
 */
class CreatorAgent {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not defined in environment variables.');
        }
    }

    /**
     * Generates a landing page for the business
     * @param {Object} business - The business details (name, phone, address, etc.)
     * @param {Object} db - The DatabaseService instance
     * @returns {Promise<string>} HTML string of the generated website
     */
    async createWebsite(business, db) {
        console.log(`[Creator] Generating website for: ${business.name}...`);

        let promptConfig;
        try {
            promptConfig = await db.getSetting('website_prompt');
        } catch (e) {
            promptConfig = {
                system: "You are an expert web developer and copywriter specializing in high-conversion landing pages.",
                instructions: "Generate a modern, beautiful, fully responsive, single-file HTML landing page. Use Tailwind CSS via CDN. The website MUST be bilingual (English and Arabic) with full RTL support. Implement a functional hamburger menu for mobile devices. Use smooth transitions and ensure all sections stack correctly on small screens using Tailwind's responsive prefixes (sm:, md:, lg:, etc.)."
            };
        }

        const prompt = `
      ${promptConfig.system}
      
      Business Details:
      - Name: ${business.name}
      - Phone: ${business.phone}
      - Address: ${business.address}
      - Industry/Types: ${(business.types || []).join(', ')}
      
      Real Business Photos (USE THESE EXACT URLS IN YOUR IMG SRC ATTRIBUTES OR BACKGROUND URLS):
      ${(business.photos && business.photos.length > 0) ? business.photos.map(p => `- ${p}`).join('\n      ') : 'No real photos available.'}
      
      Real Customer Reviews (Incorporate these into a Testimonials section to build trust):
      ${(business.reviews && business.reviews.length > 0) ? business.reviews.map(r => `"${r}"`).join('\n      ') : 'No recent reviews available.'}
      
      Requirements:
      ${promptConfig.instructions}
      
      *CRITICAL INSTRUCTION FOR RESPONSIVENESS*:
      1. Use Tailwind's grid and flex utilities with responsive prefixes (e.g., \`grid-cols-1 md:grid-cols-2\`) to ensure the layout looks perfect on phones, tablets, and desktops.
      2. Implement a functional "Hamburger Menu" for mobile view. The desktop navigation links should be hidden on small screens, and a menu icon should appear. When clicked, the menu should slide or fade in.
      3. Since this is a single file, you can use a small \`<script>\` block or a hidden checkbox technique to handle the menu toggle.
      4. Ensure padding, font sizes, and image heights are adjusted for mobile using Tailwind classes like \`px-4 md:px-8\` and \`text-2xl md:text-5xl\`.
      
      *CRITICAL INSTRUCTION FOR SERVICES/SUBPAGES & NAVIGATION*: 
      1. DO NOT use placeholders like "Service 1", "Lorem Ipsum", or empty sections.
      2. Analyze the business name, industry, and customer reviews to deduce their exact services.
      3. Fully populate the "Services" or secondary sections with real, compelling, and localized descriptions fitting this specific business in Saudi Arabia. Create comprehensive content.
      4. Since this is a strict SINGLE-PAGE website, all navigation links in the header/footer MUST use anchor tags (e.g., \`href="#services"\`) that smoothly scroll to corresponding sections on the same page. 
      5. DO NOT create fake links to external pages like \`services.html\` or \`about.html\`. All content MUST exist and be fully written out on this one single page. Ensure every section linked in the navigation menu actually exists in the HTML body with the correct \`id\` attribute.
      
      *CRITICAL INSTRUCTION FOR VISUALS*:
      1. The website MUST be visually stunning. The Hero section MUST include a large, beautiful background image or a looping background video.
      2. CRITICAL: You MUST use the "Real Business Photos" URLs provided above for the images on the site. DO NOT use generic placeholders unless no real photos are available. These photos are already fully-qualified URLs and are ready to be used inside your \`<img src="...">\` tags or CSS \`url(...)\`.
      3. Distribute the real business photos throughout the Hero and Service sections to make the website feel authentic and built specifically for them. 
      4. If real photos run out or are missing, you may use \`https://loremflickr.com/w/h/keyword?random=X\` as a fallback. If using the fallback, use simple 1-word generic keywords and append a unique random number to prevent duplicate cats from appearing.
      5. Do not just leave blank colored boxes. Use rich imagery throughout the design to make it feel premium.
      
      *CRITICAL INSTRUCTION FOR BILINGUAL SUPPORT*:
      1. DO NOT write complex custom Javascript to rearrange navigation nodes or toggle individual element's \`.active\` classes. That takes up too many tokens and truncates the generation.
      2. Keep it simple: use CSS logic. Example: Hide \`[data-lang="ar"]\` when \`html[lang="en"]\` is active, and vice versa using CSS. The Javascript switcher button should literally just toggle \`document.documentElement.lang\`.
      
      Output ONLY the raw HTML string. No markdown formatting like \`\`\`html at the top or bottom. Just the pure HTML source code starting with <!DOCTYPE html>.
    `;

        try {
            let htmlContent = await generateText(prompt, { temperature: 0.7, maxOutputTokens: 8192 });

            if (!htmlContent) {
                throw new Error('Gemini returned an empty response.');
            }

            // Clean up markdown block if the model included it despite the instruction
            if (htmlContent.startsWith('```html')) {
                htmlContent = htmlContent.replace(/^```html\n/, '').replace(/\n```$/, '');
            } else if (htmlContent.startsWith('```')) {
                htmlContent = htmlContent.replace(/^```\n/, '').replace(/\n```$/, '');
            }

            console.log(`[Creator] Website successfully generated for ${business.name} using Gemini.`);
            return htmlContent.trim();
        } catch (error) {
            const errorMsg = error.message;
            console.error(`[Creator] Error generating website via Gemini: ${errorMsg}`);
            throw new Error(`Gemini Error: ${errorMsg}`);
        }
    }
}

module.exports = CreatorAgent;
