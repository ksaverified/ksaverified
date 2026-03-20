require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function download() {
    const { data: lead } = await supabase
        .from('leads')
        .select('name, website_html')
        .eq('place_id', 'ChIJu1rZJw0PLz4RsdeHwAG3eAk')
        .single();

    if (lead && lead.website_html) {
        fs.writeFileSync('tmp/lead.html', lead.website_html);
        console.log('Saved to tmp/lead.html');
    } else {
        console.log('Lead not found or no HTML.');
    }
}
download();
