require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkResponses() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const startTime = '2026-03-07T05:30:00Z';

    // 1. Total chat logs with inbound messages
    const { data: responses, error: responseError } = await supabase
        .from('chat_logs')
        .select('*')
        .not('message_in', 'is', null)
        .gt('created_at', startTime)
        .order('created_at', { ascending: false });

    if (responseError) {
        console.error('Error fetching chat logs:', responseError);
        return;
    }

    // 2. Check for ANY chat logs (outbound too) to see if system is logging at all
    const { count: allChatCount } = await supabase
        .from('chat_logs')
        .select('*', { count: 'exact', head: true });

    // 3. Check for webhook logs/errors in 'logs' table
    const { data: webhookLogs } = await supabase
        .from('logs')
        .select('*')
        .eq('agent', 'webhook')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log(`\n--- Customer Engagement Analysis ---`);
    console.log(`Total Responses since 05:30 AM: ${responses.length}`);
    console.log(`Total Chat Logs in DB (All-time): ${allChatCount || 0}`);

    if (responses.length > 0) {
        console.log(`\nLast 3 Responses:`);
        responses.slice(0, 3).forEach(r => {
            console.log(`- From: ${r.phone} | Msg: "${r.message_in}" | At: ${r.created_at}`);
        });
    }

    if (webhookLogs && webhookLogs.length > 0) {
        console.log(`\nRecent Webhook Activity:`);
        webhookLogs.forEach(l => {
            console.log(`- Action: ${l.action} | Status: ${l.status} | Details: ${JSON.stringify(l.details)}`);
        });
    }
    console.log(`------------------------------------\n`);
}

checkResponses();
