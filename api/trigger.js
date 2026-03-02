const Orchestrator = require('../orchestrator');

export default async function handler(request, response) {
    // This endpoint allows manual triggering from the dashboard UI.
    // In a fully production-ready app, you'd add Auth/JWT checks here.

    // We only allow POST requests for this action
    if (request.method !== 'POST' && request.method !== 'GET') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[Trigger] Manual pipeline execution initiated via Dashboard.');

    try {
        const main = new Orchestrator();

        // We use non-blocking background execution so the UI doesn't hang waiting for Gemini/Vercel
        // We'll return 200 immediately, and let the orchestrator run
        main.runPipeline().catch(err => {
            console.error('[Trigger Background Error]', err);
        });

        return response.status(200).json({ success: true, message: 'Pipeline cycle launched in background.' });
    } catch (error) {
        console.error('[Trigger Error]', error.message);
        return response.status(500).json({ success: false, error: error.message });
    }
}
