require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
    const { data: leads, error } = await supabase
        .from('leads')
        .select('place_id, name, website_html')
        .ilike('name', '%Badr%Optical%');
        
    for (const lead of leads) {
        console.log(`\nFound: ${lead.name} (${lead.place_id})`);
        console.log(`Is Generic Unsplash? ${lead.website_html?.includes("https://images.unsplash.com/photo-1497366216548-37526070297c")}`);
        console.log(`Is Clinic Unsplash? ${lead.website_html?.includes("https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d")}`);
    }
}
run();
