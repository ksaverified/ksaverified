require('dotenv').config();
const DatabaseService = require('./services/db');
const CloserAgent = require('./agents/closer');

async function runTest() {
    const phone = '966507913514';
    const db = new DatabaseService();
    // Force local service for text component
    process.env.WHATSAPP_SERVICE_URL = 'http://localhost:8080';
    const closer = new CloserAgent();

    const { data: leads } = await db.supabase
        .from('leads')
        .select('*')
        .ilike('phone', `%${phone.slice(-9)}`);

    if (!leads || leads.length === 0) return;

    const lead = leads[0];
    console.log(`[Test] Re-pitching ${lead.name} with image...`);

    // We use the real CloserAgent.pitchLead which now includes image sending logic
    try {
        const result = await closer.pitchLead(lead.name, lead.phone, lead.vercel_url, db);
        console.log(`[Test] Result: ${result}`);
    } catch (err) {
        console.error('[Test] Failed:', err.message);
    }
}

runTest();
