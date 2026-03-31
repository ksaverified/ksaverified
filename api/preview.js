const DatabaseService = require('../core/services/db');
const PublisherAgent = require('../core/agents/publisher');

module.exports = async function handler(request, response) {
    const { id } = request.query;

    if (!id) {
        return response.status(400).send('Missing Lead ID');
    }

    try {
        const db = new DatabaseService();
        const lead = await db.getLead(id);

        if (!lead || !lead.website_html) {
            return response.status(404).send('<h1>404 - Preview Not Found</h1><p>This website has not been generated yet or the lead ID is invalid.</p>');
        }

        // Only inject the PayTabs/STC Pay modal if the site has not been paid for and unlocked
        // Skip injection if viewed from the Client Dashboard (dashboard=true query param)
        let finalHtml = lead.website_html;
        const isDashboardView = request.query.dashboard === 'true';

        // Inject SEO Tags if available
        const publisher = new PublisherAgent();
        if (lead.seo_title || lead.seo_description) {
            finalHtml = publisher.injectSEOTags(finalHtml, lead.seo_title, lead.seo_description);
        }

        // Inject Google Analytics (GA4) with business context
        finalHtml = publisher.injectGTag(finalHtml, 'G-JDPL5ZZZ9X', {
            page_title: lead.business_name || 'Business Site'
        });

        if (lead.status !== 'completed' && !isDashboardView) {
            finalHtml = publisher.injectModal(finalHtml, lead.place_id);
        }

        // Serve raw HTML
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        return response.status(200).send(finalHtml);

    } catch (error) {
        console.error('[Preview API Error]', error);
        return response.status(500).send('Internal Server Error');
    }
}
