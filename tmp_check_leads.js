require('dotenv').config();
const DatabaseService = require('./core/services/db');
const db = new DatabaseService();

async function checkLeads() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await db.supabase
            .from('leads')
            .select('place_id, name, status, website_html, updated_at')
            .eq('status', 'published')
            .gte('updated_at', today);

        if (error) {
            console.error(error);
            return;
        }

        console.log(`\n--- Verification Report: ${new Date().toISOString()} ---`);
        for (const l of data) {
            const len = l.website_html ? l.website_html.length : 0;
            console.log(`Lead: ${l.name.padEnd(40)} | ID: ${l.place_id.padEnd(30)} | Status: ${l.status.padEnd(10)} | HTML Len: ${len.toString().padEnd(10)} | Updated: ${l.updated_at}`);
        }
        console.log("\nScan complete.");
    } catch (err) {
        console.error("Fatal Check Error:", err);
    }
}

checkLeads();
