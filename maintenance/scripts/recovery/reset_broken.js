require('dotenv').config();
const DatabaseService = require('../../../core/services/db');
const db = new DatabaseService();

async function resetBrokenLeads() {
    try {
        console.log("Starting cleanup of broken leads...");
        
        // Find leads with status 'published', 'created', or 'retouched' but empty/null HTML
        const { data: brokenLeads, error: fetchError } = await db.supabase
            .from('leads')
            .select('place_id, name, status, website_html')
            .in('status', ['created', 'retouched', 'published', 'pitched'])
            .or('website_html.is.null,website_html.eq.""');

        if (fetchError) throw fetchError;

        console.log(`Found ${brokenLeads.length} leads with missing HTML.`);

        for (const lead of brokenLeads) {
            console.log(`Resetting ${lead.name} (${lead.place_id})...`);
            await db.supabase
                .from('leads')
                .update({
                    status: 'scouted',
                    website_html: null,
                    vercel_url: null,
                    updated_at: new Date().toISOString(),
                    retry_count: 0
                })
                .eq('place_id', lead.place_id);
        }

        console.log("Cleanup complete.");
    } catch (err) {
        console.error("Cleanup failed:", err);
    } finally {
        process.exit(0);
    }
}

resetBrokenLeads();
