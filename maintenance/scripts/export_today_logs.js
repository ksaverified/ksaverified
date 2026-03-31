require('dotenv').config();
const DatabaseService = require('../../core/services/db');

async function exportLogs() {
    try {
        const db = new DatabaseService();
        console.log('Fetching today\'s chat logs...');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Fetch chat logs from today
        const { data: logs, error } = await db.supabase
            .from('chat_logs')
            .select('*, leads(name)')
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!logs || logs.length === 0) {
            console.log('No conversations found for today yet.');
            return;
        }

        let report = `# Conversations Review - ${new Date().toLocaleDateString()}\n\n`;
        report += `Total interactions today: ${logs.length}\n\n`;

        // Group by lead
        const grouped = {};
        logs.forEach(log => {
            const leadName = log.leads?.name || log.phone || 'Unknown Lead';
            const key = log.place_id || log.phone;
            if (!grouped[key]) grouped[key] = { name: leadName, messages: [] };
            grouped[key].messages.push(log);
        });

        for (const key in grouped) {
            const group = grouped[key];
            report += `## Lead: ${group.name} (${key})\n\n`;
            group.messages.forEach(m => {
                const time = new Date(m.created_at).toLocaleTimeString();
                if (m.message_in) {
                    report += `> **[${time}] Customer:** ${m.message_in}\n\n`;
                }
                if (m.message_out) {
                    report += `> **[${time}] Gemini AI:** ${m.message_out}\n\n`;
                }
            });
            report += '---\n\n';
        }

        const fs = require('fs');
        const path = require('path');
        const artifactPath = path.join(process.cwd(), 'today_conversations.md');
        fs.writeFileSync(artifactPath, report);
        
        console.log(`Successfully exported ${logs.length} messages to ${artifactPath}`);
    } catch (err) {
        console.error('Export failed:', err);
    }
}

exportLogs();
