const axios = require('axios');

/**
 * Centralized AI Service — uses Google Gemini API directly.
 * Replaces all OpenRouter calls for free, reliable AI generation.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Generate text using Gemini with retry logic.
 * @param {string} prompt - The user prompt
 * @param {object} options - Optional overrides { temperature, maxOutputTokens, model, maxRetries }
 * @returns {Promise<string|null>} Generated text or null on failure
 */
async function generateText(prompt, options = {}) {
    if (!GEMINI_API_KEY) {
        console.error('[AI] GEMINI_API_KEY is not set.');
        return null;
    }

    const temperature = options.temperature ?? 0.7;
    const maxOutputTokens = options.maxOutputTokens ?? 8192;
    const model = options.model || DEFAULT_GEMINI_MODEL;
    const maxRetries = options.maxRetries ?? 3;
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 1) {
                // Exponential backoff: 5s, 15s, 45s
                const delayMs = 5000 * Math.pow(3, attempt - 2);
                console.log(`[AI] Retry attempt ${attempt}/${maxRetries} after ${delayMs / 1000}s delay...`);
                await new Promise(r => setTimeout(r, delayMs));
            }

            const response = await axios.post(
                `${baseUrl}?key=${GEMINI_API_KEY}`,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature,
                        maxOutputTokens
                    }
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 180000 // Increased to 3 minutes for large generations
                }
            );

            // Check for safety blocks or quota errors in the response body
            const candidate = response.data?.candidates?.[0];
            if (candidate?.finishReason === 'SAFETY') {
                console.warn('[AI] Gemini safety block triggered. Returning null.');
                return null;
            }

            const text = candidate?.content?.parts?.[0]?.text;
            
            if (!text || text.trim().length === 0) {
                const finishReason = candidate?.finishReason || 'UNKNOWN';
                lastError = new Error(`Gemini returned empty response (finishReason: ${finishReason})`);
                console.warn(`[AI] Attempt ${attempt}: ${lastError.message}`);
                continue; // Retry
            }

            if (attempt > 1) {
                console.log(`[AI] Success on attempt ${attempt}.`);
            }
            return text;

        } catch (err) {
            const status = err.response?.status;
            const errMsg = err.response?.data?.error?.message || err.message;
            lastError = new Error(`HTTP ${status || 'ERR'}: ${errMsg}`);
            console.error(`[AI] Gemini attempt ${attempt} error:`, lastError.message);

            // Don't retry on auth errors (wrong API key)
            if (status === 400 || status === 401 || status === 403) {
                console.error('[AI] Non-retryable error. Aborting.');
                return null;
            }
            // Rate limit: wait longer
            if (status === 429) {
                console.warn('[AI] Rate limited. Waiting 60s before retry...');
                await new Promise(r => setTimeout(r, 60000));
            }
        }
    }

    console.error(`[AI] All ${maxRetries} attempts failed. Last error: ${lastError?.message}`);
    return null;
}

module.exports = { generateText };
