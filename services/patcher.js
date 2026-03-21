const axios = require('axios');

/**
 * Patcher Service
 * Uses a lightweight LLM call to intelligently update website HTML with new configuration data.
 * This preserves the custom AI-generated layout while swapping out the specific content.
 */
class PatcherService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
        
        if (!this.apiKey) {
            console.warn('[Patcher] OPENROUTER_API_KEY missing. HTML patching will be limited.');
        }
    }

    /**
     * Patches the HTML with the provided configuration.
     * @param {string} currentHtml - The existing website HTML
     * @param {Object} config - The new website configuration (English/Arabic/Photos/Contact)
     * @returns {Promise<string>} The updated HTML string
     */
    async patchHtml(currentHtml, config) {
        if (!this.apiKey) return currentHtml;

        console.log('[Patcher] Patching website HTML with new configuration...');

        const systemPrompt = `You are a specialist in surgical HTML editing.
Your task is to take an existing HTML site and update its content EXACTLY as specified in a JSON configuration.

RULES:
1. **PRESERVE THE LAYOUT**: DO NOT change the structure, Tailwind classes, or scripts. Only change the text nodes and image sources.
2. **BILINGUAL SUPPORT**:
   - Updates for English content must go into elements marked for English (e.g., [data-lang="en"] or .lang-en).
   - Updates for Arabic content must go into elements marked for Arabic (e.g., [data-lang="ar"] or .lang-ar).
3. **SERVICES & TESTIMONIALS**:
   - If the configuration has more/fewer services than the HTML, intelligently add or remove nodes by CLONING existing service item structures.
   - Maintain the same styling for new items.
4. **PHOTOS**: Update <img> src attributes or style="background-image: url(...)" based on the photos section of the config.
5. **CONTACT**: Update phone numbers, emails, and addresses.
6. **MAPS**: If a 'google_maps_iframe' is provided, replace the existing iframe with it.

OUTPUT: Return ONLY the full, patched HTML string. No markdown formatting.`;

        const userPrompt = `
CURRENT HTML:
${currentHtml.substring(0, 15000)}

NEW CONFIGURATION (JSON):
${JSON.stringify(config, null, 2)}
`;

        try {
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: this.model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.1, // Low temperature for precision
                    max_tokens: 16000
                },
                {
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 60000
                }
            );

            let patchedHtml = response.data.choices[0].message.content || '';

            if (!patchedHtml) {
                throw new Error("Empty response from patcher LLM.");
            }

            // Clean up markdown block if the model included it
            if (patchedHtml.startsWith('```html')) {
                patchedHtml = patchedHtml.replace(/^```html\n/, '').replace(/\n```$/, '');
            } else if (patchedHtml.startsWith('```')) {
                patchedHtml = patchedHtml.replace(/^```\n/, '').replace(/\n```$/, '');
            }

            return patchedHtml.trim();
        } catch (error) {
            console.error(`[Patcher] Error patching HTML: ${error.message}`);
            // Return original HTML if patching fails to avoid breaking the site
            return currentHtml;
        }
    }

    /**
     * Extracts the current website configuration from the provided HTML.
     * This is useful for pre-populating the editor for the first time.
     * @param {string} html - The existing website HTML
     * @returns {Promise<Object>} The extracted configuration object
     */
    async extractConfig(html) {
        if (!this.apiKey) return null;

        console.log('[Patcher] Extracting configuration from HTML...');

        const systemPrompt = `You are a specialist in reverse-engineering HTML into structured JSON.
Your task is to take a full website HTML and extract its content into a specific JSON schema.

SCHEMA:
{
  "en": {
    "title": "...",
    "subtitle": "...",
    "hero_text": "...",
    "about": "...",
    "services": [{"title": "...", "text": "...", "photo": "..."}],
    "testimonials": [{"name": "...", "text": "..."}]
  },
  "ar": {
    "title": "...",
    "subtitle": "...",
    "hero_text": "...",
    "about": "...",
    "services": [{"title": "...", "text": "...", "photo": "..."}],
    "testimonials": [{"name": "...", "text": "..."}]
  },
  "contact": {
    "phone": "...",
    "email": "...",
    "address": "...",
    "google_maps_iframe": "..."
  },
  "photos": {
    "hero": "...",
    "about": "..."
  }
}

RULES:
1. **ACCURACY**: Extract exactly what's written in the HTML.
2. **SERVICES**: Match the items in the same order. If images are present, include their src.
3. **BILINGUAL**: 
   - Look for elements with [data-lang="en"] or .lang-en for English.
   - Look for elements with [data-lang="ar"] or .lang-ar for Arabic.
4. **FALLBACK**: If a language section is missing, try to translate the other language or leave empty.
5. **MAPS**: Extract the <iframe> src or the full iframe tag if it's a Google Map.
6. **PHOTOS**: Extract the main hero image and about section image.

OUTPUT: Return ONLY the JSON object. No markdown.`;

        const userPrompt = `HTML CONTENT:\n${html.substring(0, 15000)}`;

        try {
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: this.model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.1,
                    max_tokens: 8000
                },
                {
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 45000
                }
            );

            let content = response.data.choices[0].message.content || '';
            
            // Clean up potentially included markdown
            if (content.startsWith('```json')) {
                content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
            } else if (content.startsWith('```')) {
                content = content.replace(/^```\n/, '').replace(/\n```$/, '');
            }

            return JSON.parse(content.trim());
        } catch (error) {
            console.error(`[Patcher] Error extracting config: ${error.message}`);
            return null;
        }
    }
}

module.exports = PatcherService;
