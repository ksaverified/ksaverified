require('dotenv').config();
const DatabaseService = require('../services/db');

async function run() {
    const db = new DatabaseService();
    console.log('Fetching all leads...');
    const { data: leads, error } = await db.supabase
        .from('leads')
        .select('*');

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    console.log(`Found ${leads.length} leads. Starting audit...`);
    let count = 0;

    for (const lead of leads) {
        count++;
        process.stdout.write(`(${count}/${leads.length}) Auditing ${lead.name}... `);
        
        let score = 50; // Base score
        const checklist = lead.seo_metadata?.on_page_checklist || {
            h1: false,
            alt_text: false,
            google_business_profile: true
        };

        if (lead.website_html) {
            checklist.h1 = lead.website_html.includes('<h1');
            checklist.alt_text = lead.website_html.includes('alt="') || lead.website_html.includes("alt='");
        }

        if (lead.seo_title && lead.seo_title.length >= 30 && lead.seo_title.length <= 60) score += 15;
        if (lead.seo_description && lead.seo_description.length >= 70 && lead.seo_description.length <= 160) score += 15;
        if (checklist.h1) score += 10;
        if (checklist.alt_text) score += 10;

        const { error: updateError } = await db.supabase
            .from('leads')
            .update({
                seo_score: score,
                seo_metadata: { 
                    ...(lead.seo_metadata || {}), 
                    on_page_checklist: checklist,
                    last_audit_at: new Date().toISOString() 
                },
                updated_at: new Date().toISOString()
            })
            .eq('place_id', lead.place_id);

        if (updateError) {
            console.log(`Failed: ${updateError.message}`);
        } else {
            console.log(`Success! Score: ${score}`);
        }
    }

    console.log('\n--- AUDIT COMPLETE ---');
    process.exit(0);
}

run();
