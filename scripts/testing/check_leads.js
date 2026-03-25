require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkLeads() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: counts, error } = await supabase
        .from('leads')
        .select('status');

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    const stats = {};
    counts.forEach(c => {
        stats[c.status] = (stats[c.status] || 0) + 1;
    });

    console.log('--- Lead Stats ---');
    console.log(JSON.stringify(stats, null, 2));

    // Also check for leads with status 'scouted' that have high retry counts
    const { data: stuckLeads, error: stuckError } = await supabase
        .from('leads')
        .select('name, phone, status, retry_count, last_error')
        .eq('status', 'scouted')
        .order('retry_count', { ascending: false })
        .limit(5);

    if (stuckError) {
        console.error('Error fetching stuck leads:', stuckError);
    } else if (stuckLeads.length > 0) {
        console.log('\n--- Stuck Leads (Scouted with high retry) ---');
        stuckLeads.forEach(l => {
            console.log(`${l.name} (${l.phone}): retry ${l.retry_count}, error: ${l.last_error}`);
        });
    }
}

checkLeads();
