require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deepFetch() {
    console.log("Deep fetching last 40 logs...");
    const { data: logs, error } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);

    if (error) {
        console.error("Log fetch ERROR:", error.message);
        return;
    }

    logs.forEach(log => {
        const detailStr = JSON.stringify(log.details);
        console.log(`[${log.created_at}] [${log.agent}] ${log.action} | ${log.status} | ${detailStr.substring(0, 100)}`);
    });
}

deepFetch();
