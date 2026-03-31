require('dotenv').config();
const DatabaseService = require('../../../core/services/db');

async function showPriorityQuestions() {
    const db = new DatabaseService();
    console.log('--- 🛡️ KSA VERIFIED PRIORITY CHAT INBOX ---');

    // Fetch chat logs
    const { data: logs, error } = await db.supabase
        .from('chat_logs')
        .select('*, leads(name, phone)')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching logs:', error.message);
        return;
    }

    const priorityQuestions = [];

    // Filter for real questions in the script for now (since we haven't added an intent column to DB yet)
    for (const log of logs) {
        const inbound = (log.message_in || '').trim();
        const translated = (log.translated_message || '').trim();

        // Simple human-heuristics for priority
        const hasQuestion = inbound.includes('?') || inbound.includes('؟') || translated.includes('?');
        const isOptOut = /stop|block|remove|don't message|توقف|بلوك/i.test(inbound) || /stop|block|remove/i.test(translated);

        // Filter out known auto-reply patterns
        const autoReplyPatterns = [
            /CommerceX/i, /How can we help/i, /Welcome to/i, /شكرا لتواصلك/i, /مرحبا بك/i, /خدمة العملاء/i
        ];
        const isAutoReply = autoReplyPatterns.some(p => p.test(inbound) || p.test(translated));

        if (!isAutoReply && (hasQuestion || isOptOut)) {
            priorityQuestions.push({
                lead: log.leads?.name || 'Unknown',
                phone: log.leads?.phone || 'Unknown',
                inbound,
                translated,
                outbound: log.message_out,
                time: new Date(log.created_at).toLocaleString(),
                type: isOptOut ? '🔴 OPT-OUT REQUEST' : '🔵 CUSTOMER QUESTION'
            });
        }
    }

    if (priorityQuestions.length === 0) {
        console.log('No high-priority messages found in the last 100 logs.');
        return;
    }

    console.log(`Found ${priorityQuestions.length} important interactions:\n`);

    priorityQuestions.forEach((q, i) => {
        console.log(`[${i + 1}] ${q.type} | ${q.lead} (${q.phone})`);
        console.log(`    Time: ${q.time}`);
        console.log(`    Message: ${q.inbound}`);
        if (q.translated && q.translated !== q.inbound) {
            console.log(`    Translation: ${q.translated}`);
        }
        console.log(`    Bot Replied: ${q.outbound ? q.outbound : '❌ MANUALLY REQUIRED'}`);
        console.log('---'.repeat(10));
    });
}

showPriorityQuestions();
