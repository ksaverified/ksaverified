require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkProgress() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const startTime = '2026-03-07T05:30:00Z';

    // 1. Count leads pitched during this period
    const { count: pitchedCount, error: pitchedError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pitched')
        .gt('updated_at', startTime);

    if (pitchedError) console.error('Error fetching pitched leads:', pitchedError);

    // 2. Count logs of activity
    const { count: logCount, error: logError } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'pitch_sent')
        .gt('created_at', startTime);

    if (logError) console.error('Error fetching logs:', logError);

    // 3. Count customer responses (inbound messages)
    const { count: responseCount, error: responseError } = await supabase
        .from('chat_logs')
        .select('*', { count: 'exact', head: true })
        .not('message_in', 'is', null)
        .gt('created_at', startTime);

    if (responseError) console.error('Error fetching chat logs:', responseError);

    // 4. Count currently processing or pending
    const { count: pendingCount, error: pendingError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('status', ['scouted', 'created', 'retouched', 'published']);

    if (pendingError) console.error('Error fetching pending leads:', pendingError);

    console.log(`\n--- Pipeline Progress Since 05:30 AM ---`);
    console.log(`Leads Successfully Pitched: ${pitchedCount || 0}`);
    console.log(`Pitch Logs Recorded: ${logCount || 0}`);
    console.log(`Customer Responses Received: ${responseCount || 0}`);
    console.log(`Remaining Backlog: ${pendingCount || 0}`);
    console.log(`----------------------------------------\n`);
}

checkProgress();
