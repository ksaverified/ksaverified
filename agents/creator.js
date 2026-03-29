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
                instructions: "Generate a modern, beautiful, fully responsive, single-file HTML landing page. Use Tailwind CSS via CDN explicitly using this link: <link href=\"https://unpkg.com/tailwindcss@2.2.19/dist/tailwind.min.css\" rel=\"stylesheet\">. NEVER use cdn.jsdelivr.net as it gets blocked. The website MUST be bilingual (English and Arabic) with full RTL support. Implement a functional hamburger menu for mobile devices. Use smooth transitions and ensure all sections stack correctly on small screens using Tailwind's responsive prefixes (sm:, md:, lg:, etc.)."
            };
        }

        // Token Optimization: Map long Google Photo URLs to short aliases
        // This prevents the generation from truncating due to 800-character URLs repeated multiple times.
        // We now use semantic-ready numbering but tell the AI to use descriptive aliases
        const photoAliases = (business.photos || []).map((url, i) => ({
            alias: `GPHOTO_${i}`,
            url: url
        }));

        const prompt = `
      ${promptConfig.system}
      
      Business Details:
      - Name: ${business.name}
      - Phone: ${business.phone}
      - Address: ${business.address}
      - Industry/Types: ${(business.types || []).join(', ')}
      
      Real Business Photos (USE THESE ALIASES in your img src or background-image url() attributes):
      ${(photoAliases.length > 0) ? photoAliases.map(p => `- ${p.alias} (Real photo of the business)`).join('\n      ') : 'No real photos available.'}
      
      Real Customer Reviews (Incorporate these into a Testimonials section to build trust):
      ${(business.reviews && business.reviews.length > 0) ? business.reviews.map(r => `"${r}"`).join('\n      ') : 'No recent reviews available.'}
      
      Requirements:
      ${promptConfig.instructions}
      
      *CRITICAL INSTRUCTION FOR RESPONSIVENESS*:
      1. Use Tailwind's grid and flex utilities with responsive prefixes (e.g., \`grid-cols-1 md:grid-cols-2\`) to ensure the layout looks perfect on phones, tablets, and desktops.
      2. Implement a functional "Hamburger Menu" for mobile view.
      3. Ensure padding, font sizes, and image heights are adjusted for mobile using Tailwind classes like \`px-4 md:px-8\`.
      
      *CRITICAL INSTRUCTION FOR SERVICES/SUBPAGES & NAVIGATION*: 
      1. DO NOT use placeholders like "Service 1", "Lorem Ipsum", or empty sections.
      2. Analyze the business name, industry, and customer reviews to deduce their exact services.
      3. Fully populate the "Services" or secondary sections with real, compelling, and localized descriptions fitting this specific business in Saudi Arabia.
      
      *CRITICAL INSTRUCTION FOR VISUALS*:
      1. The website MUST be visually stunning. The Hero section MUST include a large, beautiful background image.
      2. SEMANTIC IMAGE TAGGING: Instead of random numbers, use these EXACT aliases for your images:
         - \`GPHOTO_HERO\`: Use for the main hero/opening background.
         - \`GPHOTO_INTERIOR\`: Use for "About Us" or atmosphere sections.
         - \`GPHOTO_SERVICE_1\`, \`GPHOTO_SERVICE_2\`...: Use for specific service highlights.
         - \`GPHOTO_TEAM\`: Use for team or personal bio sections.
         - \`GPHOTO_LOGO\`: Use for the brand mark / logo placeholder.
      3. PRIORITIZE REAL PHOTOS: If real photo aliases (GPHOTO_0, GPHOTO_1, etc.) are available above, use them for the HERO and INTERIOR first.
      4. If real photos are missing, use the SEMANTIC aliases (\`GPHOTO_HERO\`, \`GPHOTO_INTERIOR\`, etc.) and the Retoucher Agent will resolve them with high-quality stock photos.
      5. DO NOT use \`loremflickr\` or any other external URL. Only use \`GPHOTO_...\` aliases.
      
      *CRITICAL INSTRUCTION FOR BILINGUAL SUPPORT*:
      1. Keep it simple: use CSS logic for language toggling. The Javascript switcher button should just toggle \`document.documentElement.lang\`.
      
      Output ONLY the raw HTML string. No markdown formatting. Just the pure HTML source code starting with <!DOCTYPE html>.
      
      *SUPER CRITICAL: DO NOT STOP GENERATING UNTIL YOU REACH </html>.*
      You MUST finish the entire page down to the closing </html> tag. Do not output truncated code under any circumstance.
    `;

        try {
            let htmlContent = await generateText(prompt, { 
                temperature: 0.7, 
                maxOutputTokens: 16384, 
                model: 'gemini-2.5-pro' 
            });

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
