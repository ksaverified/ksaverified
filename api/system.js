const DatabaseService = require('../services/db');
const Orchestrator = require('../orchestrator');

module.exports = async function handler(req, res) {
    const { action } = req.query;

    try {
        switch (action) {
            case 'track':
                return await handleTrack(req, res);
            case 'trigger':
                return await handleTrigger(req, res);
            default:
                return res.status(400).json({ error: 'Invalid system action' });
        }
    } catch (error) {
        console.error(`[System API Error: ${action}]`, error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

async function handleTrack(req, res) {
    const { id, event } = req.query; // event: 'view', 'full_minute'
    if (!id || !event) return res.status(400).send('Missing id or event parameters');

    const db = new DatabaseService();
    let columnToIncrement = '';
    if (event === 'view') columnToIncrement = 'views';
    else if (event === 'full_minute') columnToIncrement = 'full_minute_views';
    else return res.status(400).send('Invalid event');

    await db.incrementLeadMetric(id, columnToIncrement);
    return res.status(200).json({ success: true });
}

async function handleTrigger(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[System] Manual pipeline execution initiated.');
    const main = new Orchestrator();
    
    // Non-blocking background execution
    main.runPipeline().catch(err => {
        console.error('[System Trigger Background Error]', err);
    });

    return res.status(200).json({ success: true, message: 'Pipeline cycle launched in background.' });
}
