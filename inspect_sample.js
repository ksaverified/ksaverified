require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function inspectSample() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Fetching sample lead...");
    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, website_html, updated_at')
        .not('website_html', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1);
        
    if (error || !leads || leads.length === 0) {
        console.error("Error or no leads found.");
        return;
    }
    
    const lead = leads[0];
    console.log(`Lead: ${lead.name}`);
    console.log(`Updated at: ${lead.updated_at}`);
    console.log("Website HTML (First 1000 chars):");
    console.log(lead.website_html.substring(0, 1000));
    
    // Check for "premium header" keywords or "glassmorphism"
    const hasPremiumHeader = lead.website_html.includes('bg-black') && lead.website_html.includes('sticky top-0');
    const hasGlassmorphism = lead.website_html.includes('backdrop-blur');
    const hasMobileToggle = lead.website_html.includes('mobile-menu-btn') || lead.website_html.includes('mobile-menu-toggle');
    
    console.log(`\nAudit Checks:`);
    console.log(`- Has Premium Header: ${hasPremiumHeader}`);
    console.log(`- Has Glassmorphism: ${hasGlassmorphism}`);
    console.log(`- Has Mobile Toggle: ${hasMobileToggle}`);
}

inspectSample();
