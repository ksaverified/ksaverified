
const DatabaseService = require('../../core/services/db');
require('dotenv').config();

async function checkLuck() {
    try {
        const db = new DatabaseService();
        console.log('--- LUCK CHECK ---');
        
        // 1. Check for any verified payments today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: payments, error: pError } = await db.supabase
            .from('leads')
            .select('name, phone, status, payment_status, updated_at')
            .or('payment_status.eq.verified,payment_status.eq.pending')
            .gte('updated_at', today.toISOString());

        if (pError) throw pError;
        
        console.log(`\n[PAYMENTS] Found ${payments?.length || 0} recent pending/verified payments:`);
        (payments || []).forEach(p => console.log(` - ${p.name} (${p.phone}): ${p.payment_status}`));

        // 2. Check for recent incoming messages
        const { data: incoming, error: iError } = await db.supabase
            .from('chat_logs')
            .select('message_in, created_at, phone, leads(name)')
            .not('message_in', 'is', null)
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false })
            .limit(5);

        if (iError) throw iError;
        
        console.log(`\n[INCOMING] Latest 5 replies from today:`);
        (incoming || []).forEach(m => console.log(` - [${new Date(m.created_at).toLocaleTimeString()}] ${m.leads?.name || m.phone}: "${m.message_in}"`));

        // 3. Check for Gemini Urgency Close activity
        const { data: urgencyLogs, error: uError } = await db.supabase
            .from('logs')
            .select('*')
            .eq('action', 'urgency_close_sent')
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false })
            .limit(5);

        if (uError) throw uError;

        console.log(`\n[SYSTEM] Latest 5 "Urgency Close" messages sent:`);
        (urgencyLogs || []).forEach(l => console.log(` - [${new Date(l.created_at).toLocaleTimeString()}] Sent to ${l.place_id}`));

    } catch (err) {
        console.error('Luck check failed:', err);
    }
}

checkLuck();
