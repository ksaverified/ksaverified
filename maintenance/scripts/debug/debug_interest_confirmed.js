require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function debugInterestConfirmed() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for full access
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('--- Debugging Interest Confirmed (warming_sent) ---');

    // 1. Fetch all warming_sent logs
    const { data: warmingLogs, error: logError } = await supabase
        .from('logs')
        .select('*')
        .eq('action', 'warming_sent');

    if (logError) {
        console.error('Error fetching warming logs:', logError);
        return;
    }

    console.log(`Found ${warmingLogs.length} warming_sent logs.`);

    const report = [];
    const warmedPlaceIds = [...new Set(warmingLogs.map(l => l.place_id).filter(id => !!id))];

    console.log(`Unique place_ids in logs: ${warmedPlaceIds.length}`);

    // 2. Check which place_ids are missing from leads table
    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('place_id, name, phone, status')
        .in('place_id', warmedPlaceIds);

    if (leadError) {
        console.error('Error fetching leads:', leadError);
        return;
    }

    const foundPlaceIds = new Set(leads.map(l => l.place_id));
    const missingPlaceIds = warmedPlaceIds.filter(id => !foundPlaceIds.has(id));

    console.log(`Leads found in DB: ${leads.length}`);
    console.log(`Place IDs missing from leads table: ${missingPlaceIds.length}`);

    if (missingPlaceIds.length > 0) {
        console.log('\n--- Missing Leads (Place IDs) ---');
        missingPlaceIds.forEach(id => {
            const logEntry = warmingLogs.find(l => l.place_id === id);
            console.log(`ID: ${id} | Log Date: ${logEntry.created_at} | Details: ${JSON.stringify(logEntry.details)}`);
        });
    }

    // 3. Check for logs with NULL place_id
    const nullLogs = warmingLogs.filter(l => !l.place_id);
    if (nullLogs.length > 0) {
        console.log(`\n--- Logs with NULL place_id: ${nullLogs.length} ---`);
        nullLogs.forEach(l => {
            console.log(`Log Date: ${l.created_at} | Agent: ${l.agent} | Details: ${JSON.stringify(l.details)}`);
        });
    }

    // 4. Check for leads that are in 'pitched' or 'completed' status (might be filtered out or displayed elsewhere)
    const statusCounts = leads.reduce((acc, l) => {
        acc[l.status] = (acc[l.status] || 0) + 1;
        return acc;
    }, {});
    console.log('\n--- Lead Status Distribution for Warmed Leads ---');
    console.log(statusCounts);

}

debugInterestConfirmed();
