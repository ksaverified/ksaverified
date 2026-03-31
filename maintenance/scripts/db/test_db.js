require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Checking Supabase:", process.env.SUPABASE_URL);
    
    // Correct destructuring for counts
    const { count: leadCount, error: leadCountError } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    if (leadCountError) {
        console.error("Error fetching leads count:", leadCountError.message);
    } else {
        console.log("Total leads count:", leadCount);
    }

    const { count: chatCount, error: chatCountError } = await supabase.from('chat_logs').select('*', { count: 'exact', head: true });
    if (chatCountError) {
        console.error("Error fetching chat logs count:", chatCountError.message);
    } else {
        console.log("Total chat logs count:", chatCount);
    }

    const { count: logsCount, error: logsCountError } = await supabase.from('logs').select('*', { count: 'exact', head: true });
    if (logsCountError) {
        console.error("Error fetching logs count:", logsCountError.message);
    } else {
        console.log("Total system logs count:", logsCount);
    }

    // Sample data check
    const { data: leads, error: leadsError } = await supabase.from('leads').select('name, status').limit(3);
    console.log("Sample leads:", leads);
}

check();
