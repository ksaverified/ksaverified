require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkSetting() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'website_prompt')
        .single();

    if (error) {
        console.error('Error fetching setting:', error);
        return;
    }

    console.log('--- Current website_prompt ---');
    console.log(JSON.stringify(data.value, null, 2));
}

checkSetting();
