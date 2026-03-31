const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/**
 * Gemini Service
 * Handles interaction with Google's Gemini models for sales messaging and lead conversion.
 */
class GeminiService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('[Gemini] GEMINI_API_KEY is missing from environment variables.');
            return;
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        // Fallback to gemini-1.5-flash if the env value is missing or likely incorrect (like 2.5)
        this.modelName = process.env.GEMINI_MODEL === 'gemini-2.5-flash' ? 'gemini-1.5-flash' : (process.env.GEMINI_MODEL || 'gemini-1.5-flash');
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
        
        console.log(`[Gemini] Initialized with model: ${this.modelName}`);
    }

    /**
     * Generates a persuasive sales message for a lead.
     * @param {Object} lead - Lead data (name, business type, etc.)
     * @param {String} context - The current sales stage or specific situation
     * @returns {Promise<String>} Generated message
     */
    async generateSalesMessage(lead, context) {
        if (!this.model) return null;

        const prompt = `
You are "KSA Verified Sales Optimizer", a top-tier digital marketing expert in Saudi Arabia.
Your goal is to close the first paying customer for a new SaaS that builds premium AI websites for local businesses.

CUSTOMER INFO:
Name: ${lead.name}
Phone: ${lead.phone}
Website Preview: ${lead.vercel_url || 'Already built for them'}
Status: ${lead.status}

CONTEXT:
${context}

RULES:
1. Be extremely polite, professional, and slightly enthusiastic.
2. Use a mix of English and Arabic (Bilingual) as is common in KSA business.
3. Highlight the specific value: A mobile-ready, professional website is essential for growing their business in Saudi Arabia.
4. Urgency: Mention the special "First Month for 19 SAR" offer which is about to expire.
5. Action: Ask them to reply "YES" or send a screenshot of their STC Pay transfer to +966 50 791 3514.
6. Keep the message concise for WhatsApp (max 150 words total).
7. Do not use placeholders like [Your Name]. Sign off as "KSA Verified Team".

Write the response directly.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error(`[Gemini] Generation failed: ${error.message}`);
            return null;
        }
    }
}

module.exports = new GeminiService();
