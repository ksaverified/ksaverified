const RetoucherAgent = require('../../../core/agents/retoucher');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function liveRetouch() {
    const place_id = 'ChIJL0_8jKsFLz4RVn3tzwhJ260';
    console.log(`[LiveRetouch] Fetching data for ${place_id}...`);
    
    const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('place_id', place_id)
        .single();
    
    if (error || !lead) {
        console.error("[LiveRetouch] Failed to fetch lead", error);
        return;
    }

    const retoucher = new RetoucherAgent();
    const business = {
        name: lead.name,
        types: ["smartphone repair", "software programming", "maintenance"]
    };

    console.log("[LiveRetouch] Starting Vision Audit with real photos...");
    try {
        const polishedHtml = await retoucher.retouchWebsite(lead.website_html, business, lead.photos || []);
        
        console.log("[LiveRetouch] Updating Supabase...");
        const { error: updateError } = await supabase
            .from('leads')
            .update({ website_html: polishedHtml, updated_at: new Date() })
            .eq('place_id', place_id);

        if (updateError) {
            console.error("[LiveRetouch] Failed to update", updateError);
        } else {
            console.log("✅ SUCCESS: Website retouched and updated live!");
        }

    } catch (err) {
        console.error("[LiveRetouch] Error:", err.message);
    }
}

liveRetouch();
