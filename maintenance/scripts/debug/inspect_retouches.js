require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const RetoucherAgent = require('../../../core/agents/retoucher');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect5() {
    console.log("--- Retoucher Inspector Started ---");
    const retoucher = new RetoucherAgent();
    
    const { data: leads, error } = await supabase
        .from('leads')
        .select('place_id, name, website_html, photos')
        .not('website_html', 'is', null)
        .limit(5);
        
    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }
    
    for (const lead of leads) {
        console.log(`\n==================================================`);
        console.log(`BUSINESS: ${lead.name}`);
        console.log(`PLACE_ID: ${lead.place_id}`);
        console.log(`==================================================`);
        
        try {
            // We'll run the retouchWebsite but we've added console logs inside retoucher.js (in previous steps)
            // that should show the AI edits. Let's make sure we see them.
            const business = { name: lead.name, types: ["local business"] };
            await retoucher.retouchWebsite(lead.website_html, business, lead.photos || []);
        } catch (e) {
            console.error(`Failed to retouch ${lead.name}:`, e.message);
        }
    }
    console.log("\n--- Inspection Complete ---");
}

inspect5();
