const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    const { data: lead, error } = await supabase
        .from('leads')
        .select('name, website_html')
        .eq('place_id', 'ChIJM2G0TAADLz4Rahdi3a1rlhE')
        .single();
    
    if (error) {
        console.error(error);
        return;
    }
    
    console.log("Website Name:", lead.name);
    console.log("Contains maps.googleapis.com?", lead.website_html.includes('maps.googleapis.com'));
}
check();
