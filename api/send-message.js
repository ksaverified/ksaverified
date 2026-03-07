const DatabaseService = require('../services/db');
const axios = require('axios');

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { phone, message, placeId } = request.body;

    if (!phone || !message) {
        return response.status(400).json({ error: 'Missing phone or message' });
    }

    try {
        const db = new DatabaseService();

        // 1. Send via local WhatsApp service (assuming it's reachable or running locally)
        // In a real Vercel environment, this would need a tunnel like Ngrok or a fixed IP.
        // For this local setup, we'll hit localhost:8080
        const whatsappServiceUrl = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:8080';

        await axios.post(`${whatsappServiceUrl}/send`, {
            to: phone,
            message: message
        });

        // 2. Log the outbound message in Supabase
        await db.saveOutboundChatLog(placeId || null, phone, message);

        return response.status(200).json({ success: true });
    } catch (error) {
        console.error('[Send API Error]', error.message);
        return response.status(500).json({ error: 'Failed to send message', details: error.message });
    }
};
