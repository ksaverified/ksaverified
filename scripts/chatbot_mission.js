const DatabaseService = require('../services/db');
const CloserAgent = require('../agents/closer');
const ChatbotAgent = require('../agents/chatbot');
require('dotenv').config();

/**
 * Chatbot Mission Orchestrator
 * Contacts leads that haven't yet been greeted, up to 50 per run.
 */
async function runMission() {
    console.log('[Mission] Starting Chatbot Contact Mission...');
    const db = new DatabaseService();
    const closer = new CloserAgent();
    const chatbot = new ChatbotAgent();

    try {
        // Fetch leads that have NOT been contacted yet (no chatbot_mission_step)
        const { data: leads, error } = await db.supabase
            .from('leads')
            .select('*')
            .is('chatbot_mission_step', null)
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) throw error;

        console.log(`[Mission] Processing ${leads.length} leads...`);
        const contactedPhones = new Set();

        for (const lead of leads) {
            try {
                const step = lead.chatbot_mission_step;
                const phone = lead.phone || lead.mobile || lead.contact_mobile;

                if (!phone) {
                    console.warn(`[Mission] Lead ${lead.name} has no phone number. Skipping.`);
                    continue;
                }

                const cleanPhone = phone.replace(/\D/g, '');
                
                // Skip if we already contacted this phone in this run (prevents cross-company contamination)
                if (contactedPhones.has(cleanPhone)) {
                    console.log(`[Mission] Already contacted ${cleanPhone} in this run. Skipping ${lead.name}.`);
                    continue;
                }

                // Skip if it looks like a landline (not starting with 05 or 5 or 9665)
                const isMobile = cleanPhone.startsWith('9665') || cleanPhone.startsWith('05') || (cleanPhone.startsWith('5') && cleanPhone.length === 9);
                if (!isMobile) {
                    console.warn(`[Mission] Lead ${lead.name} (${cleanPhone}) is likely a landline. Skipping.`);
                    continue;
                }

                contactedPhones.add(cleanPhone);

                // Step 1: Initial Greeting
                if (!step) {
                    console.log(`[Mission] Sending initial greeting to ${lead.name} (${cleanPhone})`);
                    const greeting = "Hello / مرحبا";
                    
                    try {
                        await closer.sendMessage(cleanPhone, greeting);
                        // Note: outbound log is handled automatically by whatsapp-service message_create event
                        
                        await db.supabase
                            .from('leads')
                            .update({ 
                                chatbot_mission_step: 'greeting_sent',
                                chatbot_last_contact_at: new Date().toISOString()
                            })
                            .eq('place_id', lead.place_id);
                        
                        await db.addLog('chatbot_mission', 'greeting_sent', lead.place_id, { phone: cleanPhone }, 'success');
                    } catch (sendErr) {
                        console.error(`[Mission] Greeting failed for ${lead.name}: ${sendErr.message}`);
                        // Don't stop the whole mission, just continue to next lead
                    }
                    continue;
                }

                // Step 2: Follow-up after 10 minutes from user answer
                if (step === 'user_answered_greeting') {
                    const lastContact = new Date(lead.chatbot_last_contact_at);
                    const now = new Date();
                    const diffMins = (now - lastContact) / (1000 * 60);

                    if (diffMins >= 10) {
                        console.log(`[Mission] 10 mins passed for ${lead.name}. Sending website check...`);
                        
                        try {
                            // Fetch last inbound message to detect language
                            const latestLog = await db.getLatestChatLog(cleanPhone);
                            const userMsg = latestLog ? latestLog.message_in : '';
                            const lang = await chatbot.detectLanguageManual(userMsg);

                            let followUp = "";
                            if (lang === 'ar') {
                                followUp = `مرحباً، أتواصل معك لأننا قمنا بإنشاء موقع إلكتروني لعملك وأردت فقط معرفة ما إذا كنت قد شاهدته.`;
                            } else {
                                // For English, we also ask about language preference as per user request
                                followUp = `Hello, I'm contacting you because we have made a website for your business and I just wanted to know if you have seen it. \n\nAre you comfortable talking in English or would you prefer Arabic?`;
                            }

                            await closer.sendMessage(cleanPhone, followUp);
                            // Note: outbound log is handled automatically by whatsapp-service message_create event

                            await db.supabase
                                .from('leads')
                                .update({ 
                                    chatbot_mission_step: 'website_query_sent',
                                    chatbot_last_contact_at: new Date().toISOString()
                                })
                                .eq('place_id', lead.place_id);

                            await db.addLog('chatbot_mission', 'website_query_sent', lead.place_id, { lang }, 'success');
                        } catch (sendErr) {
                            console.error(`[Mission] Follow-up failed for ${lead.name}: ${sendErr.message}`);
                        }
                    } else {
                        console.log(`[Mission] Still waiting for 10-min window for ${lead.name} (${Math.round(10 - diffMins)} mins left)`);
                    }
                }
            } catch (leadErr) {
                console.error(`[Mission] Error processing lead ${lead.name}:`, leadErr.message);
            }
        }

        console.log('[Mission] Mission processing cycle complete.');
    } catch (err) {
        console.error('[Mission] Error in mission orchestrator:', err.message);
    }
}

// Run immediately if called directly
if (require.main === module) {
    runMission().then(() => process.exit(0));
}

module.exports = runMission;
