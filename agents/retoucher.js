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

        const systemPrompt = `You are a world-class UI/UX Designer and Visual Context Specialist.
Your job is to audit HTML/Tailwind code to ensure high aesthetic quality and industry-specific relevance.

ASSET RULES:
1. **Prioritize Real Photos**: You are provided with a list of real photos from the business's Google Maps profile. USE THESE URLs to replace generic <img> src attributes or background-images.
2. **Contextual Alignment**: If the website is about "Smartphone Maintenance", do NOT show generic office buildings. Use images of repair tools, microsoldering, or technicians working on devices.
3. **Remove Broken Maps/Watermarks**: Replace any Google Maps iframe showing watermarks or missing API errors with a beautiful industry-relevant hero image.
4. **No Duplicate Media**: If the same image URL is used twice, replace the second one with a different photo from the provided list or a random relevant one from loremflickr.
5. **Premium UI**: Replace basic Tailwind classes (bg-white) with premium variations (backdrop-blur-md, bg-white/80, sleek gradients).

BUSINESS CONTEXT:
${business.name} operates in: ${(business.types || []).join(', ')}.

REAL PHOTO ASSETS (PRIORITIZE THESE):
${photos.map(p => `- ${p}`).join('\n')}

OUTPUT FORMAT:
Return ONLY a valid JSON array of edits. No markdown.
[
  { "old": "exact_html_string_to_find", "new": "improved_html_string_to_replace_it" }
]`;

        const userPrompt = `
HTML to Audit:
${rawHtml.substring(0, 15000)}
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

            let finalHtml = rawHtml;
            for (const edit of edits) {
                if (edit.old && edit.new) {
                    // Using split/join for global replace of exact strings safely
                    finalHtml = finalHtml.split(edit.old).join(edit.new);
                }
            }

            return finalHtml;
        } catch (error) {
            console.error(`[Retoucher] Audit failed: ${error.message}`);
            return rawHtml; 
        }
    }
}

module.exports = RetoucherAgent;
