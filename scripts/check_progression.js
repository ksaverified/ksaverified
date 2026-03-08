const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProgression() {
    console.log('--- Checking Lead Status Progression ---');
    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, status, updated_at')
        .in('status', ['warmed', 'created', 'retouched', 'published', 'pitched'])
        .order('updated_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    leads.forEach(l => {
        console.log(`Lead: ${l.name} - Status: ${l.status.toUpperCase()} - Updated: ${l.updated_at}`);
    });
}

checkProgression();
