require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function migrateWarmedLeads() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('--- Starting Data Migration: scouting -> warmed ---');

    // 1. Find all Warming Sent logs
    const { data: warmingLogs, error: logError } = await supabase
        .from('logs')
        .select('place_id')
        .eq('action', 'warming_sent');

    if (logError) {
        console.error('Error fetching logs:', logError.message);
        return;
    }

    const warmedPlaceIds = [...new Set(warmingLogs.map(l => l.place_id).filter(id => !!id))];
    console.log(`Found ${warmedPlaceIds.length} unique place_ids with warming_sent logs.`);

    if (warmedPlaceIds.length === 0) {
        console.log('No leads to migrate.');
        return;
    }

    // 2. Update their status to 'warmed' if they are currently 'scouted'
    const { data: updatedLeads, error: updateError } = await supabase
        .from('leads')
        .update({ status: 'warmed', updated_at: new Date().toISOString() })
        .in('place_id', warmedPlaceIds)
        .eq('status', 'scouted')
        .select();

    if (updateError) {
        console.error('Error updating leads:', updateError.message);
        return;
    }

    console.log(`Success! Updated ${updatedLeads?.length || 0} leads to 'warmed' status.`);
}

migrateWarmedLeads();
