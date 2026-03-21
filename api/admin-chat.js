const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { messages } = req.body; // Array of { role, content }

        // 1. Initialize Supabase connecting via Service Role to bypass RLS
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 2. Query Recent Context (Last 10 leads, last 20 chat logs)
        const [{ data: leads }, { data: chatLogs }] = await Promise.all([
            supabase.from('leads').select('name, phone, status, chatbot_mission_step, created_at, chatbot_last_contact_at').order('created_at', { ascending: false }).limit(10),
            supabase.from('chat_logs').select('phone, message_in, message_out, status, created_at').order('created_at', { ascending: false }).limit(20)
        ]);

        // Build a formatted summary of recent activity
        let contextText = `Here is the real-time context from the database:\n\n`;
        
        contextText += `[RECENT LEADS (last 10)]\n`;
        if (leads && leads.length > 0) {
            leads.forEach(l => {
                contextText += `- ${l.name} (${l.phone}): Status: ${l.status}, Mission Step: ${l.chatbot_mission_step || 'Not started'}\n`;
            });
        } else {
            contextText += `No recent leads found.\n`;
        }

        contextText += `\n[RECENT CHAT LOGS (last 20 messages)]\n`;
        if (chatLogs && chatLogs.length > 0) {
            chatLogs.forEach(c => {
                if (c.message_in) {
                    contextText += `- [INBOUND from ${c.phone}] (${new Date(c.created_at).toLocaleTimeString()}): ${c.message_in}\n`;
                }
                if (c.message_out) {
                    contextText += `- [OUTBOUND to ${c.phone}] (${new Date(c.created_at).toLocaleTimeString()}): ${c.message_out}\n`;
                }
            });
        } else {
            contextText += `No recent chat logs found.\n`;
        }

        // 3. System Prompt
        const systemPrompt = {
            role: 'system',
            content: `You are the KSAVerified Admin Assistant. You are an AI designed to help the system administrator monitor the progress of the WhatsApp lead outreach Chatbot.

Your knowledge is primarily based on the database context provided below. When the administrator asks you questions like "Who have you talked to today?" or "Did anyone reply?", base your answers strictly on the recent chat logs and leads provided in the context. Be concise, professional, and helpful.

${contextText}`
        };

        // 4. Call OpenRouter
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterKey) throw new Error('Missing OPENROUTER_API_KEY');

        const apiPayload = {
            model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
            messages: [systemPrompt, ...messages],
            temperature: 0.3
        };

        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openRouterKey}`,
                'HTTP-Referer': 'https://ksaverified.com',
                'X-Title': 'KSAVerified Admin Assistant'
            },
            body: JSON.stringify(apiPayload)
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`OpenRouter error: ${response.status} ${errBody}`);
        }

        const data = await response.json();
        const replyText = data.choices[0].message.content;

        res.status(200).json({ reply: replyText });
    } catch (err) {
        console.error('[Admin Chat API Error]:', err);
        res.status(500).json({ error: err.message });
    }
};
