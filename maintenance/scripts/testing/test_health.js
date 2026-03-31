require('dotenv').config();
const DatabaseService = require('../../../core/services/db');

async function testHealth() {
    const db = new DatabaseService();
    try {
        console.log("Testing health check using 'settings' table...");
        const { data, error } = await db.supabase.from('settings').select('key').limit(1);
        if (error) {
            console.error("Health check FAILED with error:", error.message);
            console.error("Error Details:", error);
        } else {
            console.log("Health check PASSED. Found:", data);
        }
    } catch (e) {
        console.error("Health check EXCEPTION:", e.message);
    }
}

testHealth();
