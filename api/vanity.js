const DatabaseService = require('../services/db');
const fs = require('fs');
const path = require('path');

module.exports = async function handler(request, response) {
    const { slug } = request.query;

    if (!slug) {
        return fallbackToDashboard(response);
    }

    try {
        const db = new DatabaseService();
        const { data: lead, error } = await db.supabase
            .from('leads')
            .select('website_html')
            .eq('slug', slug.toLowerCase())
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[Vanity API DB Error]', error);
        }

        if (lead && lead.website_html) {
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            return response.status(200).send(lead.website_html);
        }

        // If not found in DB, fallback to serving the React Dashboard
        return fallbackToDashboard(response);

    } catch (error) {
        console.error('[Vanity API Error]', error);
        return fallbackToDashboard(response);
    }
}

function fallbackToDashboard(response) {
    const indexPath = path.join(process.cwd(), 'public', 'index.html');
    try {
        const html = fs.readFileSync(indexPath, 'utf8');
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        return response.status(200).send(html);
    } catch {
        return response.status(404).send('Not Found');
    }
}
