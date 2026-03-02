const Orchestrator = require('../orchestrator');

// Set max duration to 60 seconds (requires Vercel Pro, otherwise limit is 10s or 15s on Free Tier)
// NOTE: Google Places API + Gemini API + Vercel deployment usually takes 10-20 seconds.

module.exports = async function handler(request, response) {
    // Optional: Security check. 
    // You can set a CRON_SECRET environment variable in Vercel to prevent random people from triggering your cron.
    // if (request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return response.status(401).json({ error: 'Unauthorized' });
    // }

    console.log('[Cron] Triggered via Vercel scheduled execution.');

    try {
        const main = new Orchestrator();

        // Vercel serverless functions are ephemeral. We await one full pipeline cycle per execution.
        await main.runPipeline();

        return response.status(200).json({ success: true, message: 'Pipeline cycle completed successfully.' });
    } catch (error) {
        console.error('[Cron Error]', error.message);
        return response.status(500).json({ success: false, error: error.message });
    }
}
