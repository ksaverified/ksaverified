const DatabaseService = require('../services/db');

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { phone } = request.body;

    if (!phone) {
        return response.status(400).json({ error: 'Phone number is required.' });
    }

    try {
        const db = new DatabaseService();
        await db.recordLogin(phone);
        
        return response.status(200).json({ 
            success: true, 
            message: 'Login event recorded.' 
        });
    } catch (error) {
        console.error('[API Record Login Error]', error.message);
        return response.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
