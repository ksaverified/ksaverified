require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getStatus() {
    console.log('--- LEAD STATUS BY RECENT ---');
    try {
        // If no RPC, let's just fetch recent invalid leads to verify the landline theory
        const { data: invalidLeads, error: invError } = await supabase
            .from('leads')
            .select('name, phone, status, last_error')
            .eq('status', 'invalid')
            .order('updated_at', { ascending: false })
            .limit(10);

        if (invError) throw invError;

        invalidLeads.forEach(l => {
            console.log(`[INVALID] ${l.name.padEnd(20)} | Phone: ${l.phone.padEnd(15)} | Error: ${l.last_error}`);
        });

    } catch (e) {

        console.error('[Error] Status fetch failed:', e.message);
    }
}

async function getRecentLogs() {
    console.log('\n--- RECENT AGENT LOGS ---');
    try {
        const { data, error } = await supabase
            .from('logs')
            .select('agent, action, status, created_at, details')
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) {
            console.error('[Error] Failed to fetch logs:', error.message);
            return;
        }

        data.forEach(log => {
            console.log(`[${log.created_at}] [${log.agent.toUpperCase().padEnd(10)}] ${log.action.padEnd(25)} - ${log.status}`);
            if (log.details && Object.keys(log.details).length > 0) {
                // Only show first 100 chars of details to avoid mess
                const detailsStr = JSON.stringify(log.details);
                console.log(`   Details: ${detailsStr.length > 100 ? detailsStr.substring(0, 100) + '...' : detailsStr}`);
            }
        });

    } catch (e) {
        console.error('[Fatal] Log fetch failed:', e.message);
    }
}

async function run() {
    await getStatus();
    await getRecentLogs();
}

run();
