const DatabaseService = require('../services/db');
const axios = require('axios');

module.exports = async function handler(req, res) {
    const { action, id } = req.query;
    const db = new DatabaseService();

    try {
        switch (action) {
            case 'global':
                return await handleGlobalSEO(db, req, res);
            case 'details':
                return await handleSEODetails(db, id, req, res);
            case 'update':
                return await handleSEOUpdate(db, id, req, res);
            case 'audit':
                return await handleSEOAudit(db, id, req, res);
            case 'sitemap':
                return await handleSitemap(db, req, res);
            case 'robots':
                return await handleRobots(req, res);
            case 'ping-google':
                return await handlePingGoogle(db, id, req, res);
            default:
                return res.status(400).json({ error: 'Invalid SEO action' });
        }
    } catch (error) {
        console.error(`[SEO API Error: ${action}]`, error.message);
        return res.status(500).send(action === 'sitemap' ? 'Error generating sitemap' : error.message);
    }
};

async function handleSitemap(db, req, res) {
    const baseUrl = 'https://ksaverified.com';
    try {
        const { data: leads, error } = await db.supabase
            .from('leads')
            .select('slug, updated_at')
            .not('slug', 'is', null)
            .eq('status', 'live');

        if (error) throw error;

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

        for (const lead of leads) {
            const lastMod = lead.updated_at ? new Date(lead.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            xml += `  <url>\n    <loc>${baseUrl}/${lead.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        }

        xml += '</urlset>';
        res.setHeader('Content-Type', 'text/xml');
        return res.status(200).send(xml);
    } catch (error) {
        throw error;
    }
}

async function handleRobots(req, res) {
    const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://ksaverified.com/sitemap.xml`;

    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(robots);
}

async function handleGlobalSEO(db, req, res) {
    // Fetch SEO health for all sites (Admin view)
    const { data, error } = await db.supabase
        .from('leads')
        .select('place_id, name, vercel_url, status, indexing_status, seo_score, seo_metadata, created_at')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, data });
}

async function handleSEODetails(db, id, req, res) {
    if (!id) return res.status(400).json({ error: 'Lead ID required' });
    const lead = await db.getLead(id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    return res.status(200).json({ 
        success: true, 
        data: {
            seo_title: lead.seo_title,
            seo_description: lead.seo_description,
            seo_score: lead.seo_score,
            indexing_status: lead.indexing_status,
            seo_metadata: lead.seo_metadata
        }
    });
}

async function handleSEOUpdate(db, id, req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!id) return res.status(400).json({ error: 'Lead ID required' });

    const { seo_title, seo_description, seo_metadata } = req.body;

    const { data, error } = await db.supabase
        .from('leads')
        .update({
            seo_title,
            seo_description,
            seo_metadata,
            updated_at: new Date().toISOString()
        })
        .eq('place_id', id)
        .select();

    if (error) throw error;
    return res.status(200).json({ success: true, data: data[0] });
}

async function handleSEOAudit(db, id, req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!id) return res.status(400).json({ error: 'Lead ID required' });

    const lead = await db.getLead(id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Basic SEO Audit Logic (simulated metrics)
    let score = 50; // Starting base score
    
    // Check for essential elements in lead data and inferred website structure
    const checklist = lead.seo_metadata?.on_page_checklist || {
        h1: false,
        alt_text: false,
        google_business_profile: true // Assumed true if it has a place_id
    };

    // Simulate checks if not already audited or to refresh
    if (lead.website_html) {
        checklist.h1 = lead.website_html.includes('<h1');
        checklist.alt_text = lead.website_html.includes('alt="') || lead.website_html.includes("alt='");
    }

    if (lead.seo_title && lead.seo_title.length >= 30 && lead.seo_title.length <= 60) score += 15;
    if (lead.seo_description && lead.seo_description.length >= 70 && lead.seo_description.length <= 160) score += 15;
    if (checklist.h1) score += 10;
    if (checklist.alt_text) score += 10;

    const { data, error } = await db.supabase
        .from('leads')
        .update({
            seo_score: score,
            seo_metadata: { 
                ...(lead.seo_metadata || {}), 
                on_page_checklist: checklist,
                last_audit_at: new Date().toISOString() 
            },
            updated_at: new Date().toISOString()
        })
        .eq('place_id', id)
        .select();

    if (error) throw error;
    return res.status(200).json({ success: true, score, data: data[0] });
}

async function handlePingGoogle(db, id, req, res) {
    try {
        let targetUrl = 'https://ksaverified.com/sitemap.xml';
        
        if (id) {
            const lead = await db.getLead(id);
            if (lead && lead.slug) {
                targetUrl = `https://ksaverified.com/${lead.slug}`;
            }
        }

        const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(targetUrl)}`;
        await axios.get(pingUrl);
        
        // Update status in DB if individual
        if (id) {
            await db.supabase
                .from('leads')
                .update({ indexing_status: 'pending', updated_at: new Date().toISOString() })
                .eq('place_id', id);
        }

        return res.status(200).json({ 
            success: true, 
            message: id ? 'Google notified of site update.' : 'Successfully notified Google. They will background crawl your sitemap shortly.' 
        });
    } catch (error) {
        if (error.response && error.response.status === 204) {
            return res.status(200).json({ success: true, message: 'Google accepted the notification.' });
        }
        throw new Error('Failed to notify Google: ' + error.message);
    }
}
