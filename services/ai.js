const axios = require('axios');

/**
 * Centralized AI Service — Primary: Vercel AI Gateway, Fallbacks: Direct Google Gemini (v1beta), OpenRouter.
 */

const VERCEL_AI_KEY = process.env.VERCEL_AI_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

/**
 * Generate text using Gemini (v1beta) with OpenRouter fallback.
 * @param {string} prompt - The user prompt
 * @param {object} options - Optional overrides { temperature, maxOutputTokens, model, maxRetries, forceOpenRouter, forceGemini }
 * @returns {Promise<string|null>} Generated text or null on failure
 */
async function generateText(prompt, options = {}) {
    // Primary routing logic: Skip Vercel if not forced
    const useOpenRouter = options.forceOpenRouter && !!OPENROUTER_API_KEY;
    const useVercel = options.forceVercel && !!VERCEL_AI_KEY; // Only use Vercel if explicitly forced
    
    const maxRetries = options.maxRetries ?? 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 1) {
                const delayMs = 5000 * Math.pow(3, attempt - 2);
                console.log(`[AI] Retry attempt ${attempt}/${maxRetries} after ${delayMs/1000}s delay...`);
                await new Promise(r => setTimeout(r, delayMs));
            }

            if (useVercel) {
                // VERCEL AI GATEWAY (Primary)
                const model = options.model || DEFAULT_GEMINI_MODEL;
                const response = await axios.post(
                    'https://ai-gateway.vercel.sh/v1/chat/completions',
                    {
                        model: model.startsWith('google/') ? model : `google/${model}`,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: options.temperature ?? 0.7,
                        max_tokens: options.maxOutputTokens ?? 4096
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${VERCEL_AI_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 60000
                    }
                );

                const text = response.data?.choices?.[0]?.message?.content;
                if (text && text.trim().length > 0) return text.trim();
                
                console.warn('[AI] Vercel Gateway returned empty. Falling back to Gemini Direct...');
                return generateText(prompt, { ...options, forceGemini: true });

            } else if (!useOpenRouter) {
                if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
                
                const model = options.model || DEFAULT_GEMINI_MODEL;
                // If model already contains 'models/', don't prefix it
                const modelPath = model.includes('/') ? model : `models/${model}`;
                const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${GEMINI_API_KEY}`;
                
                const response = await axios.post(url, {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: options.temperature ?? 0.7,
                        maxOutputTokens: options.maxOutputTokens ?? 4096
                    }
                }, { timeout: 60000 });

                const candidate = response.data?.candidates?.[0];
                const text = candidate?.content?.parts?.[0]?.text;
                
                if (text && text.trim().length > 0) return text.trim();
                
                const reason = candidate?.finishReason || 'Unknown';
                console.warn(`[AI] Gemini direct returned empty content. Reason: ${reason}`);

                if (OPENROUTER_API_KEY && !options.forceGemini) {
                    console.info('[AI] Attempting OpenRouter fallback...');
                    return generateText(prompt, { ...options, forceOpenRouter: true });
                }
                throw new Error(`Direct Gemini empty response (Reason: ${reason})`);

            } else {
                const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model: options.model || OPENROUTER_MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: options.temperature ?? 0.7,
                    max_tokens: options.maxOutputTokens ?? 2048
                }, {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'https://ksaverified.com',
                        'X-Title': 'KSA Verified Admin'
                    },
                    timeout: 60000
                });

                const text = response.data?.choices?.[0]?.message?.content;
                if (text) return text.trim();
                throw new Error('OpenRouter returned empty');
            }
        } catch (err) {
            const errMsg = err.response?.data?.error?.message || err.message;
            lastError = new Error(`Attempt ${attempt} failed: ${errMsg}`);
            console.error(`[AI] ${lastError.message}`);

            // Fallback from Vercel to Gemini on Vercel-specific errors
            if (useVercel && (errMsg.toLowerCase().includes('credit') || errMsg.toLowerCase().includes('vercel') || err.response?.status >= 400)) {
                console.warn('[AI] Vercel Gateway failed. Falling back to Gemini Direct...');
                return generateText(prompt, { ...options, forceGemini: true });
            }

            if (errMsg.toLowerCase().includes('credit')) break;
            if (err.response?.status === 429) await new Promise(r => setTimeout(r, 60000));
        }
    }

    console.error(`[AI] Generative failure: ${lastError?.message}`);
    return null;
}

module.exports = { generateText };
