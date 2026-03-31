require('dotenv').config();
const DatabaseService = require('../services/db');
async function run() {
    try {
        const db = new DatabaseService();
        console.log('--- TOP PROSPECTS REPORT ---');
        
        // 1. Find leads who logged in (Top Intent)
        const { data: logins, error: lErr } = await db.supabase
            .from('leads')
            .select('name, phone, login_count, last_login_at, vercel_url, place_id')
            .gt('login_count', 0)
            .order('last_login_at', { ascending: false })
            .limit(10);
            
        if (lErr) throw lErr;
        console.log('\n--- LEADS WITH LOGINS (High Intent) ---');
        logins.forEach(l => console.log(`[${l.last_login_at}] ${l.name} (${l.phone}): ${l.login_count} logins | Site: ${l.vercel_url}`));

        // 2. Find those who replied (Conversational Intent)
        const { data: replies, error: rErr } = await db.supabase
            .from('chat_logs')
            .select('*, leads(name, phone, status, login_count)')
            .not('message_in', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (rErr) throw rErr;
        console.log('\n--- RECENT CUSTOMER REPLIES ---');
        replies.forEach(r => console.log(`[${r.created_at}] ${r.leads?.name || r.phone}: "${r.message_in}"`));

    } catch (err) {
        console.error(err);
    }
}
run();
