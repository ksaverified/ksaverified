require('dotenv').config();
const DatabaseService = require('../../../core/services/db');

async function fixMissingHtml() {
    const db = new DatabaseService();
    console.log('[Maintenance] Checking for leads with missing HTML in advanced states...');

    // Query for leads in created, retouched, published, or pitched status but with no HTML
    const { data: brokenLeads, error } = await db.supabase
        .from('leads')
        .select('place_id, name, status, website_html')
        .in('status', ['created', 'retouched', 'published', 'pitched'])
        .or('website_html.is.null,website_html.eq.""');

    if (error) {
        console.error('[Maintenance] Error querying broken leads:', error.message);
        return;
    }

    if (!brokenLeads || brokenLeads.length === 0) {
        console.log('[Maintenance] No broken leads found. Everything looks good!');
        return;
    }

    console.log(`[Maintenance] Found ${brokenLeads.length} broken leads. Resetting to 'scouted'...`);

    for (const lead of brokenLeads) {
        console.log(`[Maintenance] Resetting: ${lead.name} (${lead.place_id}) - Status was: ${lead.status}`);
        
        const { error: updateError } = await db.supabase
            .from('leads')
            .update({
                status: 'scouted',
                website_html: null,
                vercel_url: null,
                is_validated: false,
                updated_at: new Date().toISOString(),
                last_error: 'Reset via maintenance: Missing HTML payload'
            })
            .eq('place_id', lead.place_id);

        if (updateError) {
            console.error(`[Maintenance] Failed to reset ${lead.place_id}:`, updateError.message);
        } else {
            // Also log to system_logs for traceability
            await db.addLog('maintenance', 'lead_reset', lead.place_id, { 
                previousStatus: lead.status, 
                reason: 'Missing HTML found during maintenance' 
            }, 'warning');
        }
    }

    console.log('[Maintenance] Done. Orchestrator will re-process these leads in the next cycle.');
}

if (require.main === module) {
    fixMissingHtml()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}
