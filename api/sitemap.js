const DatabaseService = require('../services/db');

module.exports = async function handler(req, res) {
    const db = new DatabaseService();
    const baseUrl = 'https://ksaverified.com';

    try {
        // Fetch all live leads with a slug
        const { data: leads, error } = await db.supabase
            .from('leads')
            .select('slug, updated_at')
            .not('slug', 'is', null)
            .eq('status', 'live');

        if (error) throw error;

        // Start XML string
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Add root URL
        xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

        // Add each lead URL
        for (const lead of leads) {
            const lastMod = lead.updated_at ? new Date(lead.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            xml += `  <url>\n    <loc>${baseUrl}/${lead.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        }

        xml += '</urlset>';

        res.setHeader('Content-Type', 'text/xml');
        return res.status(200).send(xml);
    } catch (error) {
        console.error('[Sitemap API Error]', error.message);
        return res.status(500).send('Error generating sitemap');
    }
};
