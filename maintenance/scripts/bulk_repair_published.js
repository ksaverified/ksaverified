require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const RetoucherAgent = require('../../core/agents/retoucher');
const DatabaseService = require('../../core/services/db');
const CertifierAgent = require('../../core/agents/certifier');

/**
 * Bulk Repair Script
 * Iterates through 'published' leads that haven't been retouched yet.
 * 1. Retouches HTML (replacing placeholders with real/Pexels photos).
 * 2. Certifies HTML (ensures quality & bilingual content).
 * 3. Updates the DB (enabling Orchestrator's retargeting cycle to pick them up).
 */
async function runBulkRepair() {
    const db = new DatabaseService();
    const retoucher = new RetoucherAgent();
    const certifier = new CertifierAgent();
    
    // Command line argument for limit, default 10
    const limit = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 10;

    console.log(`\n[BulkRepair] 🚀 Starting repair cycle for backlog (Limit: ${limit})...`);

    try {
        // Fetch leads: status = 'published' AND website_retouched_at = NULL
        // These are the 307 leads that need a visual refresh.
        const { data: leads, error } = await db.supabase
            .from('leads')
            .select('*')
            .eq('status', 'published')
            .is('website_retouched_at', null)
            .limit(limit);

        if (error) {
            console.error('[BulkRepair] ❌ Error fetching leads:', error.message);
            return;
        }

        if (!leads || leads.length === 0) {
            console.log('[BulkRepair] 💎 No leads found in backlog that need retouching. All good!');
            return;
        }

        console.log(`[BulkRepair] Found ${leads.length} leads to process.`);

        let successCount = 0;
        let failCount = 0;
        let skipCount = 0;

        for (const lead of leads) {
            try {
                console.log(`\n[BulkRepair] 🏗 Processing Lead: ${lead.name} (${lead.place_id})`);
                
                if (!lead.website_html) {
                    console.warn(`[BulkRepair] ⚠️ Lead ${lead.name} has no website_html. Skipping.`);
                    skipCount++;
                    continue;
                }

                // STEP 1: Retouch (Aesthetic Audit + Placeholder Resolution)
                console.log(`[BulkRepair] 🎨 Retouching images and layout...`);
                // Passing existing photos if many, otherwise letting Pexels handle it
                const newHtml = await retoucher.retouchWebsite(lead.website_html, lead, lead.photos || []);
                
                // STEP 2: Certify (Quality Gate)
                console.log(`[BulkRepair] 🛡 Running deep certification checks...`);
                const certResult = await certifier.certifyHtml(newHtml, lead);
                
                // STEP 3: Update DB
                // This will trigger the dynamic route to show the fresh content immediately.
                // Setting is_certified = true allows Orchestrator's Group A (Retargeting) to pick it up.
                const updateData = { 
                    website_html: newHtml,
                    website_retouched_at: new Date().toISOString(),
                    is_certified: certResult.passed,
                    audit_score: certResult.score,
                    validation_notes: Array.isArray(certResult.issues) ? certResult.issues.join(', ') : certResult.report
                };

                await db.updateLeadStatus(lead.place_id, 'published', updateData);
                
                console.log(`[BulkRepair] ✅ Finished ${lead.name}. Certified: ${certResult.passed}`);
                successCount++;
                
                // Log result to central logs
                await db.addLog('bulk_repair', 'lead_repaired', lead.place_id, { 
                    score: certResult.score, 
                    passed: certResult.passed,
                    name: lead.name
                }, certResult.passed ? 'success' : 'warning');

            } catch (leadError) {
                console.error(`[BulkRepair] ❌ Failed to repair lead ${lead.name}:`, leadError.message);
                failCount++;
                await db.addLog('bulk_repair', 'repair_lead_error', lead.place_id, { error: leadError.message }, 'error');
            }
        }

        console.log(`\n[BulkRepair] 🏁 Cycle finished. Summary:`);
        console.log(`   - Repaired: ${successCount}`);
        console.log(`   - Skipped: ${skipCount}`);
        console.log(`   - Failed: ${failCount}`);
    } catch (globalError) {
        console.error('[BulkRepair] 🚨 Fatal error during repair execution:', globalError.stack || globalError.message);
    }
    
    process.exit(0);
}

runBulkRepair();
