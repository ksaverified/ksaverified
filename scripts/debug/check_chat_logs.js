const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkChatLogs() {
    // These are the 12 leads we recovered
    const placeIds = [
        'ChIJ1c8-TzH8PT4RsN_C1O6zN9Q', // Black Horse
        'ChIJW2_-TzH8PT4RsN_C1O6zN9Q', // etc... (just examples, I'll fetch them)
    ];

    console.log('--- Checking Chat Logs for Warmed Leads ---');

    const { data: leads } = await supabase.from('leads').select('place_id, name, phone').eq('status', 'warmed');

    for (const lead of leads) {
        const { data: logs } = await supabase
            .from('chat_logs')
            .select('*')
            .eq('place_id', lead.place_id)
            .order('created_at', { ascending: false });

        console.log(`Lead: ${lead.name} (${lead.phone}) - Logs: ${logs ? logs.length : 0}`);
        if (logs && logs.length > 0) {
            logs.forEach(log => {
                console.log(`  [${log.direction}] ${log.message.substring(0, 50)}...`);
            });
        }
    }
}

checkChatLogs();
