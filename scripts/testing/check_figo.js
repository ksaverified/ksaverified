
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkFigo() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
        .from('leads')
        .select('name, status, vercel_url, retry_count')
        .eq('place_id', 'ChIJnQaWY0kFLz4ROA2TfVCgyms')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('--- LEAD STATUS: ---');
        console.log(JSON.stringify(data, null, 2));
    }
}
checkFigo();
