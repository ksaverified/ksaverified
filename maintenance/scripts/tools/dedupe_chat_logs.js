const DatabaseService = require('../../../core/services/db');
require('dotenv').config();

async function dedupe() {
    const db = new DatabaseService();
    console.log('[Dedupe] fetching all chat logs...');
    
    const { data: logs, error } = await db.supabase
        .from('chat_logs')
        .select('id, phone, message_in, message_out, created_at')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('[Dedupe] Error fetching logs:', error.message);
        return;
    }

    console.log(`[Dedupe] Analyzing ${logs.length} logs...`);
    
    const toDelete = [];
    const lastSeen = {}; // { phone: { content: string, time: Date } }

    for (const log of logs) {
        const phone = log.phone;
        const content = log.message_out || log.message_in;
        const time = new Date(log.created_at);

        if (lastSeen[phone]) {
            const last = lastSeen[phone];
            const timeDiff = (time - last.time) / 1000; // seconds

            if (last.content === content && timeDiff < 5) {
                // Duplicate found within 5 seconds
                toDelete.push(log.id);
                continue;
            }
        }

        lastSeen[phone] = { content, time };
    }

    if (toDelete.length === 0) {
        console.log('[Dedupe] No duplicates found.');
        return;
    }

    console.log(`[Dedupe] Found ${toDelete.length} duplicates. Deleting in batches...`);
    
    // Delete in batches of 100
    for (let i = 0; i < toDelete.length; i += 100) {
        const batch = toDelete.slice(i, i + 100);
        const { error: delError } = await db.supabase
            .from('chat_logs')
            .delete()
            .in('id', batch);
            
        if (delError) {
            console.error(`[Dedupe] Batch delete failed at ${i}:`, delError.message);
        } else {
            console.log(`[Dedupe] Deleted ${i + batch.length}/${toDelete.length}`);
        }
    }

    console.log('[Dedupe] Done!');
}

dedupe().catch(console.error);
