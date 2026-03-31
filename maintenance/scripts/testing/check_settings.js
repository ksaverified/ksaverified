require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkQueries() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: q, error: qError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'search_queries')
        .single();

    if (qError) {
        console.error('Error fetching search_queries:', qError);
    } else {
        console.log('--- Search Queries ---');
        console.log(JSON.stringify(q.value, null, 2));
    }

    const { data: p, error: pError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'website_prompt')
        .single();

    if (pError) {
        console.error('Error fetching website_prompt:', pError);
    } else {
        console.log('\n--- Website Prompt ---');
        console.log(JSON.stringify(p.value, null, 2));
    }
}

checkQueries();
