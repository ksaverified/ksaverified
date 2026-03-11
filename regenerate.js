require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const CreatorAgent = require('./agents/creator');
const RetoucherAgent = require('./agents/retoucher');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function regenerate() {
    const place_id = 'ChIJAxhceSEDLz4RF7ribj5-dyU';
    console.log(`Fetching data for place_id: ${place_id}...`);
    
    // 1. Fetch the raw data
    const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('place_id', place_id)
        .single();
        
    if (error) {
        console.error("Error fetching lead:", error);
        return;
    }
    
    // We need to pass the business details to Creator
    const business = {
        name: lead.name,
        phone: lead.phone,
        address: lead.address,
        types: lead.types || ["local business"],
        photos: lead.photos || [],
        reviews: lead.reviews || []
    };
    
    // Dummy DB object for the Creator
    const dummyDb = {
        getSetting: async (key) => { throw new Error('Use fallback'); } // forces fallback prompt
    };

    const creator = new CreatorAgent();
    console.log("Generating fresh HTML via Gemini...");
    
    try {
        const rawHtml = await creator.createWebsite(business, dummyDb);
        console.log("Generation complete! length:", rawHtml.length);
        
        console.log("Passing to Retoucher...");
        const retoucher = new RetoucherAgent();
        const retouchedHtml = await retoucher.retouchWebsite(rawHtml, business, business.photos);
        
        console.log("Retouching complete! length:", retouchedHtml.length);
        
        // Update Supabase
        const { error: updateError } = await supabase
            .from('leads')
            .update({ website_html: retouchedHtml })
            .eq('place_id', place_id);
            
        if (updateError) {
            console.error("Failed to update Supabase:", updateError);
        } else {
            console.log("Successfully rebuilt and updated Supabase for TOP CROWN SALOON!");
        }
    } catch (e) {
        console.error("Regeneration failed:", e);
    }
}

regenerate();
