const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLead(name) {
    const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('name', name)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- Lead Details ---');
    console.log(`Name: ${lead.name}`);
    console.log(`Status: ${lead.status}`);
    console.log(`Vercel URL: ${lead.vercel_url}`);
    console.log(`Retry Count: ${lead.retry_count}`);
    console.log(`Last Error: ${lead.last_error}`);
}

checkLead('Black Horse');
