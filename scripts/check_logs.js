require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLogs() {
    console.log("Fetching last 20 logs from:", process.env.SUPABASE_URL);
    
    const { data: logs, error } = await supabase
        .from('logs')
        .select('agent, action, details, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching logs:", error.message);
    } else {
        logs.forEach(log => {
            console.log(`[${log.created_at}] [${log.agent}] ${log.action} (${log.status}):`, JSON.stringify(log.details));
        });
    }
}

checkLogs();
