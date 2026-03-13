require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function getFullHtml() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, website_html')
        .order('updated_at', { ascending: false })
        .limit(1);
        
    if (error || !leads || leads.length === 0) return;
    
    console.log(`--- FULL HTML START: ${leads[0].name} ---`);
    console.log(leads[0].website_html);
    console.log(`--- FULL HTML END ---`);
}

getFullHtml();
