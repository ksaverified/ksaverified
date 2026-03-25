const axios = require('axios');

/**
 * Centralized AI Service — uses Google Gemini API directly.
 * Replaces all OpenRouter calls for free, reliable AI generation.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Generate text using Gemini.
 * @param {string} prompt - The user prompt
 * @param {object} options - Optional overrides { temperature, maxOutputTokens }
 * @returns {Promise<string|null>} Generated text or null on failure
 */
async function generateText(prompt, options = {}) {
    if (!GEMINI_API_KEY) {
        console.error('[AI] GEMINI_API_KEY is not set.');
        return null;
    }

    const temperature = options.temperature ?? 0.7;
    const maxOutputTokens = options.maxOutputTokens ?? 8192;

    try {
        const response = await axios.post(
            `${BASE_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature,
                    maxOutputTokens
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 120000
            }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Gemini returned empty response.');
        return text;
    } catch (err) {
        const errMsg = err.response?.data?.error?.message || err.message;
        console.error('[AI] Gemini generation error:', errMsg);
        return null;
    }
}

module.exports = { generateText };
