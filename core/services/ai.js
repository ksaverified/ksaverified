const axios = require('axios');
// Priority: Local Ollama → Cerebras → OpenRouter Free Tier → Vercel Gateway
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const VERCEL_AI_KEY = process.env.VERCEL_AI_KEY;

// Confirmed working free models via OpenRouter (fallback only)
const OPENROUTER_FREE_MODELS = [
    'google/gemini-2.0-flash-001:free',
    'google/gemini-2.0-flash-lite-001:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'meta-llama/llama-3.1-8b-instruct:free'
];

/**
 * Generate text using the best available AI provider.
 * Priority: Local Ollama → Cerebras → OpenRouter Free → Vercel Gateway
 * @param {string} prompt
 * @param {object} options - { temperature, maxOutputTokens, model, maxRetries }
 * @returns {Promise<string|null>}
 */
async function generateText(prompt, options = {}) {
    const maxRetries = options.maxRetries ?? 2;
    let lastError = null;

    // ── PRIORITY 0: Local Ollama (Zero Cost, GPU Accelerated) ─────────────
    try {
        // [Task-Based Selection] Pick 3b for code/complex tasks, 1.5b for speed/simple status tasks
        let model = options.model;
        if (!model) {
            const isCodeTask = prompt.toLowerCase().includes('generate code') || 
                              prompt.toLowerCase().includes('function') || 
                              prompt.includes('```');
            model = isCodeTask ? 'qwen2.5-coder:3b' : 'qwen2.5-coder:1.5b';
        }

        const response = await axios.post(OLLAMA_URL, {
            model: model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: options.temperature ?? 0.7,
                num_predict: options.maxOutputTokens ?? 4096
            }
        }, { timeout: 120000 }); // Longer timeout for local generation

        const text = response.data?.response;
        if (text && text.trim().length > 0) {
            console.log(`[AI] Generated via Local Ollama (${model}).`);
            return text.trim();
        }
    } catch (err) {
        // Silently fail to next provider if Ollama isn't running or model missing
        if (err.code !== 'ECONNREFUSED') {
            console.warn(`[AI] Local Ollama failed: ${err.message}. Falling back...`);
        }
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (attempt > 1) {
            const delayMs = 3000 * attempt;
            console.log(`[AI] Retry attempt ${attempt}/${maxRetries} after ${delayMs/1000}s delay...`);
            await new Promise(r => setTimeout(r, delayMs));
        }

        // ── PRIORITY 1: Cerebras Inference API (Ultra-fast) ──────────────
        if (CEREBRAS_API_KEY) {
            try {
                const response = await axios.post('https://api.cerebras.ai/v1/chat/completions', {
                    model: 'llama3.1-8b',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: options.temperature ?? 0.7,
                    max_tokens: options.maxOutputTokens ?? 4096
                }, {
                    headers: {
                        'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                });
                const text = response.data?.choices?.[0]?.message?.content;
                if (text && text.trim().length > 0) {
                    console.log(`[AI] Generated via Cerebras.`);
                    return text.trim();
                }
            } catch (err) {
                const msg = err.response?.data?.error?.message || err.message;
                lastError = new Error(`Attempt ${attempt} Cerebras: ${msg}`);
                console.warn(`[AI] Cerebras failed: ${msg}. Falling back to Gemini...`);
            }
        }

        // Gemini Direct fallback explicitly removed at user request.
    }

    // ── PRIORITY 3: OpenRouter Free Tier (fallback) ───────────────────────────
    if (OPENROUTER_API_KEY) {
        console.log('[AI] Trying OpenRouter free tier fallback...');
        for (const modelId of OPENROUTER_FREE_MODELS) {
            try {
                const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model: modelId,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: options.temperature ?? 0.7,
                    max_tokens: options.maxOutputTokens ?? 4096
                }, {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'https://ksaverified.com',
                        'X-Title': 'KSA Verified'
                    },
                    timeout: 60000
                });
                const text = response.data?.choices?.[0]?.message?.content;
                if (text && text.trim().length > 0) {
                    console.log(`[AI] Generated via OpenRouter (${modelId}).`);
                    return text.trim();
                }
            } catch (err) {
                const msg = err.response?.data?.error?.message || err.message;
                console.warn(`[AI] OpenRouter model ${modelId} failed: ${msg}`);
                if (msg.toLowerCase().includes('credit')) break;
            }
        }
    }

    // ── PRIORITY 4: Vercel AI Gateway (last resort) ───────────────────────────
    if (VERCEL_AI_KEY) {
        try {
            console.log('[AI] Trying Vercel AI Gateway fallback...');
            const response = await axios.post(
                'https://ai-gateway.vercel.sh/v1/chat/completions',
                {
                    model: `google/gemini-2.0-flash`,
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
            if (text && text.trim().length > 0) {
                console.log('[AI] Generated via Vercel Gateway.');
                return text.trim();
            }
        } catch (err) {
            console.warn('[AI] Vercel Gateway failed:', err.response?.data?.error?.message || err.message);
        }
    }

    console.error(`[AI] All providers exhausted. Last error: ${lastError?.message}`);
    return null;
}

module.exports = { generateText };
