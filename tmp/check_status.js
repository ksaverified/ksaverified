const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    const { data: leads } = await supabase
        .from('leads')
        .select('name, status, website_html')
        .neq('website_html', null)
        .like('website_html', '%maps.googleapis.com%');

    let statusCount = {};
    leads.forEach(l => {
        statusCount[l.status] = (statusCount[l.status] || 0) + 1;
    });

    console.log("Affected Websites by Status:");
    console.table(statusCount);
}
check();
