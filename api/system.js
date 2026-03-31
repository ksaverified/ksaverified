const DatabaseService = require('../core/services/db');
const Orchestrator = require('../core/orchestrator');

module.exports = async function handler(req, res) {
    const { action } = req.query;

    try {
        switch (action) {
            case 'track':
                return await handleTrack(req, res);
            case 'trigger':
                return await handleTrigger(req, res);
            case 'translate':
                return await handleTranslate(req, res);
            case 'send-message':
                return await handleSendMessage(req, res);
            case 'notification-worker':
                const dbInstance = new DatabaseService();
                return await handleNotificationWorker(dbInstance, req, res);
            default:
                return res.status(400).json({ error: 'Invalid system action' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

async function handleNotificationWorker(db, req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // Find logs that are not notified
        const { data: logs, error } = await db.supabase
            .from('seo_change_logs')
            .select('*, leads(name, phone)')
            .eq('notified', false);

        if (error) throw error;

        for (const log of logs) {
            console.log(`[Worker] Notifying ${log.leads.phone} about ${log.change_type}`);
            
            // In production, use your WhatsApp service to notify:
            // await db.addLog('notification_service', 'sent_gbp_change_alert', log.place_id, { type: log.change_type });

            await db.supabase
                .from('seo_change_logs')
                .update({ notified: true })
                .eq('id', log.id);
        }

        return res.status(200).json({ success: true, processed: logs.length });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function handleTranslate(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { text, targetLang } = req.body;
    if (!text || !targetLang) return res.status(400).json({ error: 'Missing text or targetLang' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Translate the following text to ${targetLang}. Return ONLY the translated text. Do not add quotes, explanations, or conversational filler.
    Text: "${text}"`;

    const result = await model.generateContent(prompt);
    const translatedText = result.response.text().trim();
    return res.status(200).json({ translatedText });
}

async function handleSendMessage(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { phone, message, placeId } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'Missing phone or message' });

    const db = new DatabaseService();
    const axios = require('axios');
    const whatsappServiceUrl = 'https://adelaida-ferulaceous-hypsometrically.ngrok-free.dev';

    await axios.post(`${whatsappServiceUrl}/send`, { to: phone, message });
    await db.saveOutboundChatLog(placeId || null, phone, message);
    return res.status(200).json({ success: true });
}

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
