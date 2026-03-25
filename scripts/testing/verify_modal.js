require('dotenv').config();
const DatabaseService = require('../services/db');
const PublisherAgent = require('../agents/publisher');

async function testPreviewLogic() {
    const mockResponse = {
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        send: function (content) {
            this.content = content || '';
            return this;
        },
        setHeader: function (name, value) {
            this.headers = this.headers || {};
            this.headers[name] = value;
            return this;
        }
    };

    const db = new DatabaseService();
    // Fetch a lead that is NOT completed so the modal logic triggers
    const { data: testLeads } = await db.supabase
        .from('leads')
        .select('place_id, status, website_html')
        .neq('status', 'completed')
        .not('website_html', 'is', null)
        .limit(1);

    if (!testLeads || testLeads.length === 0) {
        console.error('No suitable test leads found.');
        return;
    }

    const testLeadId = testLeads[0].place_id;
    console.log(`Using test lead ID: ${testLeadId} (Status: ${testLeads[0].status})`);

    const getMockRequest = (dashboard) => ({
        query: {
            id: testLeadId,
            dashboard: dashboard
        }
    });

    const handler = async (req, res) => {
        const { id } = req.query;
        try {
            const lead = await db.getLead(id);
            if (!lead || !lead.website_html) {
                return res.status(404).send('Not Found');
            }

            let finalHtml = lead.website_html;
            const isDashboardView = req.query.dashboard === 'true';

            if (lead.status !== 'completed' && !isDashboardView) {
                const publisher = new PublisherAgent();
                finalHtml = publisher.injectModal(lead.website_html, lead.place_id);
                console.log(`[Result] ${isDashboardView ? 'Dashboard' : 'Normal'} view: Modal INJECTED`);
            } else {
                console.log(`[Result] ${isDashboardView ? 'Dashboard' : 'Normal'} view: Modal SKIPPED`);
            }
            return res.status(200).send(finalHtml);
        } catch (e) {
            console.error(e);
            return res.status(500).send('Error');
        }
    };

    console.log('\n--- Testing DIRECT view (dashboard=false) ---');
    const resDirect = Object.assign({}, mockResponse);
    await handler(getMockRequest('false'), resDirect);

    console.log('\n--- Testing DASHBOARD view (dashboard=true) ---');
    const resDashboard = Object.assign({}, mockResponse);
    await handler(getMockRequest('true'), resDashboard);

    if (resDirect.content.includes('publisher-modal-overlay') && !resDashboard.content.includes('publisher-modal-overlay')) {
        console.log('\n✅ VERIFICATION SUCCESSFUL: Modal is conditional!');
    } else {
        console.log('\n❌ VERIFICATION FAILED');
        if (!resDirect.content.includes('publisher-modal-overlay')) console.log('   - Direct view missing modal');
        if (resDashboard.content.includes('publisher-modal-overlay')) console.log('   - Dashboard view incorrectly has modal');
    }
}

testPreviewLogic();
