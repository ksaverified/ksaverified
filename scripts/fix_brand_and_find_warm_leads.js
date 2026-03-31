require('dotenv').config();
const DatabaseService = require('../services/db');

async function fixBrandAndFindWarmLeads() {
    try {
        const db = new DatabaseService();
        console.log('Fixing brand names...');
        
        // 1. Update lead names
        const { data: updatedLeads, error: updateError } = await db.supabase
            .from('leads')
            .update({ name: 'KSA Verified Test Business' })
            .ilike('name', '%ALATLAS%');
            
        if (updateError) console.error('Error updating leads:', updateError);
        else console.log('Successfully renamed ALATLAS leads.');

        // 2. Find warm leads (last 48h)
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        console.log('Searching for inbound messages since:', fortyEightHoursAgo);
        
        const { data: logs, error: logsError } = await db.supabase
            .from('chat_logs')
            .select('*, leads(name, phone, business_category)')
            .not('message_in', 'is', null)
            .gt('created_at', fortyEightHoursAgo)
            .order('created_at', { ascending: false });

        if (logsError) throw logsError;

        if (logs && logs.length > 0) {
            console.log('\n--- WARM LEADS FOUND ---');
            logs.forEach(log => {
                console.log(`[${new Date(log.created_at).toLocaleString()}] ${log.leads?.name || log.phone}: "${log.message_in}"`);
            });
        } else {
            console.log('\nNo warm leads (replies) found in the last 48 hours.');
        }

    } catch (err) {
        console.error('Script failed:', err);
    }
}

fixBrandAndFindWarmLeads();
