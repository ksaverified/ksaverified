const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkRecentChatbotActivity() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('--- Checking Recent Chatbot Activity (Last 24h) ---');

    const { data: logs, error } = await supabase
        .from('chat_logs')
        .select('*')
        .not('message_out', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching chat logs:', error.message);
        return;
    }

    if (!logs || logs.length === 0) {
        console.log('No recent AI responses found in chat_logs.');
    } else {
        logs.forEach(log => {
            console.log(`[${log.created_at}] To: ${log.phone}`);
            console.log(`In: ${log.message_in}`);
            console.log(`Out: ${log.message_out}`);
            console.log(`Status: ${log.status}`);
            console.log('---');
        });
    }

    console.log('--- Checking Chatbot Engine Logs ---');
    const { data: engLogs, error: engError } = await supabase
        .from('logs')
        .select('*')
        .eq('agent', 'chatbot')
        .order('created_at', { ascending: false })
        .limit(10);

    if (engError) {
        console.error('Error fetching engine logs:', engError.message);
        return;
    }

    engLogs.forEach(log => {
        console.log(`[${log.created_at}] ${log.action} - ${log.status}`);
        if (log.details) console.log(`Details: ${JSON.stringify(log.details)}`);
    });
}

checkRecentChatbotActivity();
