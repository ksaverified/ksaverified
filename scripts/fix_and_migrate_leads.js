const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const OLD_SUPABASE_URL = 'https://ozkmsuodpghtsqcmpsmk.supabase.co';
const OLD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96a21zdW9kcGdodHNxY21wc21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ2MjgzNCwiZXhwIjoyMDg4MDM4ODM0fQ.5SuOB9t6zsGgfIk7IL8IKvG-izsDU5RdkSLGVOPmBBA';

const oldDb = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
const newDb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Fetching leads from old DB...');
    const { data: rows, error: fetchError } = await oldDb.from('leads').select('*').limit(10);
    
    if (fetchError) {
        console.error('Fetch error:', fetchError);
        return;
    }

    console.log(`Fetched ${rows.length} rows. Attempting upsert...`);
    
    // Explicitly filter columns we know might be missing based on schema.sql
    const validColumns = [
        'place_id', 'name', 'phone', 'address', 'lat', 'lng', 'status', 
        'photos', 'website_html', 'vercel_url', 'subscription_tier', 
        'payment_date', 'reminded_5d', 'reminded_3d', 'reminded_1d', 
        'retry_count', 'last_error', 'created_at', 'updated_at'
    ];

    const filteredRows = rows.map(r => {
        const filtered = {};
        validColumns.forEach(c => { if (c in r) filtered[c] = r[c]; });
        return filtered;
    });

    const { error: insertError } = await newDb.from('leads').upsert(filteredRows);

    if (insertError) {
        console.error('Insert error:', insertError);
    } else {
        console.log('Success! Migrated 10 leads.');
    }
}

run();
