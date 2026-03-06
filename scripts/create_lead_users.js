require('dotenv').config();
const DatabaseService = require('../services/db');
const authService = require('../services/auth');

/**
 * Catch-up Script: create_lead_users.js
 * Iterates through all existing leads and creates a Supabase Auth account for each.
 */
async function catchUpUsers() {
    const db = new DatabaseService();

    console.log('--- Starting Catch-up User Creation ---');

    // 1. Fetch all leads
    const { data: leads, error } = await db.supabase
        .from('leads')
        .select('place_id, name, phone, status');

    if (error) {
        console.error('[Catch-up] Error fetching leads:', error.message);
        return;
    }

    console.log(`[Catch-up] Found ${leads.length} leads to process.`);

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const lead of leads) {
        if (!lead.phone) {
            console.warn(`[Catch-up] Skipping lead ${lead.name} (No phone number).`);
            continue;
        }

        try {
            // format phone if needed (AuthService handles raw digits but CloserAgent usually cleans it)
            // Let's use the same cleaning logic as CloserAgent if possible, but AuthService is generic.
            const formattedPhone = lead.phone.replace(/\D/g, '');

            // Register lead (creates or updates user)
            const result = await authService.registerLead({
                name: lead.name,
                phone: formattedPhone
            });

            if (result.isNew) {
                console.log(`[Catch-up] ✅ CREATED user for ${lead.name} (${formattedPhone})`);
                createdCount++;
            } else {
                console.log(`[Catch-up] 🔄 UPDATED user for ${lead.name} (${formattedPhone})`);
                updatedCount++;
            }

            // Small delay to avoid hitting Supabase rate limits if lead count is high
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (err) {
            console.error(`[Catch-up] ❌ FAILED for ${lead.name}:`, err.message);
            errorCount++;
        }
    }

    console.log('\n--- Catch-up Complete ---');
    console.log(`Created: ${createdCount}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Errors:  ${errorCount}`);
    console.log('-------------------------');
}

catchUpUsers();
