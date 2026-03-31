require('dotenv').config();
const DatabaseService = require('../services/db');

async function run() {
    const db = new DatabaseService();
    
    // Check ALATLAS leads
    const { data: updated, error: uErr } = await db.supabase.from('leads').update({ name: 'KSA Verified Test Business' }).ilike('name', '%ALATLAS%');
    console.log('Renamed ALATLAS test leads:', uErr ? uErr.message : 'Success');

    const { data: updated2, error: uErr2 } = await db.supabase.from('leads').update({
        contact_name: 'KSA Verified Test Contact'
    }).ilike('contact_name', '%ALATLAS%');
    
    // Find warm leads
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: warmLeads, error: lErr } = await db.supabase
        .from('chat_logs')
        .select('*, leads(name, phone, status, place_id)')
        .not('message_in', 'is', null)
        .gt('created_at', fortyEightHoursAgo)
        .order('created_at', { ascending: false });

    if (lErr) {
        console.error(lErr);
    } else {
        console.log('--- WARM PROSPECTS (Last 48h REPLIES) ---');
        const unique = {};
        warmLeads.forEach(log => {
           let n = log.leads ? `${log.leads.name} (${log.leads.place_id})` : log.phone;
           if (!unique[n]) unique[n] = [];
           unique[n].push(`[${log.created_at}] ${log.message_in}`);
        });
        
        Object.keys(unique).forEach(k => {
           console.log(`\nLead: ${k}`);
           unique[k].forEach(m => console.log('  ' + m));
        });
    }
}
run();
