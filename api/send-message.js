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

        // 1. Send via local WhatsApp service
        // Temporarily hardcoded for immediate stability due to Vercel env propagation lag
        const whatsappServiceUrl = 'https://adelaida-ferulaceous-hypsometrically.ngrok-free.dev';

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
