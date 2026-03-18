const axios = require('axios');
require('dotenv').config();

const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;

if (!VERCEL_TOKEN || !PROJECT_ID) {
    console.error('Missing VERCEL_API_TOKEN or VERCEL_PROJECT_ID in .env');
    process.exit(1);
}

const api = axios.create({
    baseURL: 'https://api.vercel.com',
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
});

const variablesToSync = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'GOOGLE_PLACES_API_KEY',
    'VITE_GOOGLE_PLACES_API_KEY',
    'GEMINI_API_KEY',
    'OPENROUTER_API_KEY',
    'WHATSAPP_WEBHOOK_URL'
];

async function sync() {
    console.log(`Syncing environment variables for project: ${PROJECT_ID}...`);
    
    // 1. Get existing variables
    let existingVars = [];
    try {
        const res = await api.get(`/v9/projects/${PROJECT_ID}/env`);
        existingVars = res.data.envs;
    } catch (err) {
        console.error('Failed to fetch existing env vars:', err.response?.data || err.message);
        return;
    }

    for (const key of variablesToSync) {
        const value = process.env[key];
        if (!value) {
            console.warn(`[Skip] ${key} is not defined in local .env`);
            continue;
        }

        const existing = existingVars.find(v => v.key === key);

        if (existing) {
            // Update existing
            try {
                await api.patch(`/v9/projects/${PROJECT_ID}/env/${existing.id}`, {
                    value: value,
                    target: ['production', 'preview', 'development']
                });
                console.log(`[Updated] ${key}`);
            } catch (err) {
                console.error(`[Error] Failed to update ${key}:`, err.response?.data || err.message);
            }
        } else {
            // Create new
            try {
                await api.post(`/v9/projects/${PROJECT_ID}/env`, {
                    key: key,
                    value: value,
                    type: 'plain',
                    target: ['production', 'preview', 'development']
                });
                console.log(`[Created] ${key}`);
            } catch (err) {
                console.error(`[Error] Failed to create ${key}:`, err.response?.data || err.message);
            }
        }
    }

    console.log('\nSynchronization complete! Please redeploy the project in Vercel for changes to take effect.');
}

sync();
