const DatabaseService = require('../services/db');

module.exports = async function handler(request, response) {
    if (request.method !== 'GET' && request.method !== 'POST') {
        return response.status(405).send('Method not allowed');
    }

    const { id, action } = request.query;

    if (!id || !action) {
        return response.status(400).send('Missing id or action parameters');
    }

    try {
        const db = new DatabaseService();

        let columnToIncrement = '';
        if (action === 'view') {
            columnToIncrement = 'views';
        } else if (action === 'full_minute') {
            columnToIncrement = 'full_minute_views';
        } else {
            return response.status(400).send('Invalid action');
        }

        await db.incrementLeadMetric(id, columnToIncrement);

        return response.status(200).json({ success: true });
    } catch (error) {
        console.error('[Track API Error]', error);
        return response.status(500).send('Internal Server Error');
    }
}
