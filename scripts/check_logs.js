require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkLogs() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching logs:', error);
        return;
    }

    console.log('--- Recent Logs ---');
    data.forEach(log => {
        console.log(`[${log.created_at}] ${log.agent} - ${log.action} (${log.status})`);
        if (log.details) console.log(`   Details: ${JSON.stringify(log.details)}`);
    });
}

checkLogs();
