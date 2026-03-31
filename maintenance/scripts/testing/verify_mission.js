const DatabaseService = require('../../../core/services/db');
require('dotenv').config();

async function check() {
    const db = new DatabaseService();
    const { data, error } = await db.supabase
        .from('leads')
        .select('name, phone, chatbot_mission_step, chatbot_last_contact_at')
        .order('created_at', { ascending: true })
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    console.log('--- MISSION STATUS REPORT ---');
    data.forEach((l, i) => {
        const step = l.chatbot_mission_step || 'PENDING';
        const lastContact = l.chatbot_last_contact_at ? new Date(l.chatbot_last_contact_at).toLocaleString() : 'N/A';
        console.log(`${i+1}. [${step}] ${l.name} (${l.phone}) - Last: ${lastContact}`);
    });
}

check();
