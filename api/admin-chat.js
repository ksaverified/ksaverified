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

        // 4. Define Tools
        const tools = [
            {
                type: "function",
                function: {
                    name: "trigger_pipeline",
                    description: "Starts the main KSAVerified orchestrator pipeline to scrape new leads from Google Maps. Use this when the user asks to find new leads."
                }
            },
            {
                type: "function",
                function: {
                    name: "trigger_chatbot_mission",
                    description: "Starts the chatbot mission to selectively send the initial WhatsApp greeting to uncontacted leads in the database. Use this when the user asks to start contacting leads or start the mission."
                }
            },
            {
                type: "function",
                function: {
                    name: "send_whatsapp_message",
                    description: "Sends a manual WhatsApp text message to a specific phone number.",
                    parameters: {
                        type: "object",
                        properties: {
                            phone: { type: "string", description: "The phone number to send the message to, e.g. 966537177672" },
                            message: { type: "string", description: "The exact text message to send" }
                        },
                        required: ["phone", "message"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "update_lead_status",
                    description: "Changes a lead's status in the database.",
                    parameters: {
                        type: "object",
                        properties: {
                            phone: { type: "string", description: "The phone number of the lead" },
                            status: { type: "string", enum: ["interested", "not_interested", "junk", "contacted"], description: "The new status to assign to the lead" }
                        },
                        required: ["phone", "status"]
                    }
                }
            }
        ];

        // 5. Call OpenRouter
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterKey) throw new Error('Missing OPENROUTER_API_KEY');

        const apiPayload = {
            model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
            messages: [systemPrompt, ...messages],
            temperature: 0.3,
            tools: tools
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
        const messageResponse = data.choices[0].message;

        // 6. Handle Tool Calls if any
        if (messageResponse.tool_calls && messageResponse.tool_calls.length > 0) {
            let functionResults = [];
            const { exec } = require('child_process');
            
            for (const toolCall of messageResponse.tool_calls) {
                const name = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments || '{}');
                let result = '';
                
                try {
                    if (name === 'trigger_pipeline') {
                        exec('node orchestrator.js', { cwd: process.cwd(), detached: true });
                        result = 'Successfully started the main pipeline (scraping leads) in the background.';
                    } else if (name === 'trigger_chatbot_mission') {
                        exec('node scripts/chatbot_mission.js', { cwd: process.cwd(), detached: true });
                        result = 'Successfully started chatbot mission (sending greetings to up to 50 leads) in the background.';
                    } else if (name === 'send_whatsapp_message') {
                        const axios = require('axios');
                        const url = process.env.WHATSAPP_API_URL || 'http://127.0.0.1:8081';
                        // Catch error silently so the bot can report it smoothly
                        await axios.post(`${url}/send`, { to: args.phone, message: args.message });
                        result = `Successfully sent message to ${args.phone}`;
                    } else if (name === 'update_lead_status') {
                        const { error } = await supabase.from('leads').update({ status: args.status }).eq('phone', args.phone);
                        if (error) throw error;
                        result = `Successfully updated lead ${args.phone} status to ${args.status}`;
                    } else {
                        result = `Unknown function ${name}`;
                    }
                } catch (e) {
                    result = `Failed to execute ${name}: ${e.message}`;
                    console.error('[Admin Chat Tool Error]', e);
                }
                
                functionResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: name,
                    content: result
                });
            }

            // Second pass: Send results back to OpenRouter
            const secondPayload = {
                model: apiPayload.model,
                messages: [
                    ...apiPayload.messages,
                    messageResponse,
                    ...functionResults
                ],
                temperature: 0.3
            };
            
            const secondResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openRouterKey}`,
                    'HTTP-Referer': 'https://ksaverified.com',
                    'X-Title': 'KSAVerified Admin Assistant'
                },
                body: JSON.stringify(secondPayload)
            });

            if (!secondResponse.ok) {
                throw new Error(`OpenRouter second pass error: ${secondResponse.status}`);
            }

            const secondData = await secondResponse.json();
            return res.status(200).json({ reply: secondData.choices[0].message.content });
        }

        // Return direct text if no tools called
        res.status(200).json({ reply: messageResponse.content });
    } catch (err) {
        console.error('[Admin Chat API Error]:', err);
        res.status(500).json({ error: err.message });
    }
};
