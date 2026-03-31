require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function auditLeads() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Auditing leads table...");
    
    // Count by status
    const { data: statusCounts, error: statusError } = await supabase
        .from('leads')
        .select('status');
        
    if (statusError) {
        console.error("Error fetching statuses:", statusError.message);
        return;
    }
    
    const counts = (statusCounts || []).reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {});
    
    console.log("\nLead counts by status:");
    console.table(counts);
    
    // Check for null website_html
    const { count: nullHtmlCount, error: nullHtmlError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .is('website_html', null);
        
    console.log(`Leads with null website_html: ${nullHtmlCount || 0}`);
    
    // Get most recent retouches
    const { data: recentLeads, error: recentError } = await supabase
        .from('leads')
        .select('place_id, name, status, updated_at, vercel_url')
        .not('website_html', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(10);
        
    if (recentError) {
        console.error("Error fetching recent leads:", recentError.message);
        return;
    }
    
    console.log("\nMost recently updated leads (potentially retouched):");
    console.table(recentLeads);
}

auditLeads();
