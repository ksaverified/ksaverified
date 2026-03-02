const { waitUntil } = require('@vercel/functions');
const Orchestrator = require('../orchestrator');

// Set max duration to 60 seconds (requires Vercel Pro, otherwise limit is 10s or 15s on Free Tier)
// NOTE: Google Places API + Gemini API + Vercel deployment usually takes 10-20 seconds.

module.exports = async function handler(request, response) {
    // Security check for cron-job.org
    // Set CRON_SECRET in your Vercel Environment Variables
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-key';
    const providedKey = request.query?.key || request.headers.authorization?.replace('Bearer ', '');

    if (providedKey !== cronSecret) {
        console.warn(`[Cron] Unauthorized execution attempt with key: ${providedKey}`);
        return response.status(401).json({ error: 'Unauthorized. Invalid API Key.' });
    }

    console.log('[Cron] Triggered execution. Authorized. Spawning background task.');

    try {
        const main = new Orchestrator();

        // Use waitUntil to process the AI Orchestrator in the background without Vercel freezing the function.
        // This instantly returns a 200 OK to the client so cron-job.org doesn't log a 30s connection timeout.
        waitUntil(main.runPipeline().catch(console.error));

        return response.status(200).json({ success: true, message: 'Pipeline cycle spawned securely in background.' });
    } catch (error) {
        console.error('[Cron Error]', error.message);
        return response.status(500).json({ success: false, error: error.message });
    }
}
