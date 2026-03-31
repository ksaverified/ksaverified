const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSentResponses() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('--- Checking for response_sent logs ---');

    const { data: logs, error } = await supabase
        .from('logs')
        .select('*')
        .eq('agent', 'chatbot')
        .eq('action', 'response_sent')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (!logs || logs.length === 0) {
        console.log('No "response_sent" logs found.');
    } else {
        logs.forEach(log => {
            console.log(`[${log.created_at}] Sent response: ${JSON.stringify(log.details)}`);
        });
    }
}

checkSentResponses();
