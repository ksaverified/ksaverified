const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resetRetries() {
    console.log('--- Resetting Retries for Warmed Leads ---');
    const { data, error } = await supabase
        .from('leads')
        .update({ retry_count: 0, last_error: null })
        .eq('status', 'warmed')
        .select();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Successfully reset retry counts for ${data.length} leads.`);
}

resetRetries();
