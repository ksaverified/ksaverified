const { generateText } = require('../services/ai');
const CloserAgent = require('./closer');

/**
 * Chatbot Agent
 * Handles inbound WhatsApp messages, reads training data from Supabase,
 * generates a contextual reply using Gemini, and sends it via the WhatsApp service.
 */
class ChatbotAgent {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('[Chatbot] GEMINI_API_KEY missing. Chatbot AI disabled.');
        }
    }

    /**
     * Core AI generation method using Gemini
     */
    async generateAI(prompt) {
        return generateText(prompt);
    }

    async translateText(text) {
        if (!text) return null;
        const prompt = `Translate the following text to English for admin review. If it's already in English or just an emoji/symbol, just return the exact same text. Do not add any conversational filler, just output the translation:\n\n"${text}"`;
        return this.generateAI(prompt);
    }

    async classifyIntent(messageText) {
        const prompt = `
        Analyze the following WhatsApp message from a local business and classify it into EXACTLY one of these categories:
        1. BUSINESS_AUTO_REPLY: Detailed business info, mission statements, "how can we help you", or "we are unavailable" messages that look like automatic responders.
        2. USER_INTERESTED: Positive responses like "YES", "I am interested", "show me", "نعم", "مهتم", "ارسل", or any variation expressing interest in the free trial or preview.
        3. USER_QUESTION: A real person asking a specific question about price, features, or the website link.
        4. USER_GREETING: Just saying hi, hello, or sending emojis like 🙏 or 👍.
        5. USER_NEGATIVE: Stop, don't message me, annoy, block, etc.
        6. OTHER: Anything else.

        Message: "${messageText}"

        Return ONLY the category name.
        `;

        const result = await this.generateAI(prompt);
        const intent = result ? result.trim().toUpperCase() : 'UNKNOWN';
        console.log(`[Chatbot] Classified intent: ${intent}`);
        return intent;
    }

    async detectLanguageManual(text) {
        if (!text) return 'en';
        // Simple heuristic for Arabic characters
        const arabicPattern = /[\u0600-\u06FF]/;
        return arabicPattern.test(text) ? 'ar' : 'en';
    }

    async handleMessage(lead, incomingPhone, messageText, db) {
        try {
            // 1. Classify Intent first
            const intent = await this.classifyIntent(messageText);
            const placeId = lead ? lead.place_id : null;
            await db.addLog('chatbot', 'intent_classified', placeId, { intent, message: messageText }, 'info');

            // 2. Filter out Auto-Replies
            if (intent === 'BUSINESS_AUTO_REPLY') {
                console.log(`[Chatbot] Ignoring detected auto-reply from ${lead?.name || incomingPhone}`);
                
                // Update the chat log status to 'ignored' so it doesn't stay in the pending dashboard
                await db.supabase
                    .from('chat_logs')
                    .update({ status: 'ignored' })
                    .eq('phone', incomingPhone)
                    .eq('message_in', messageText)
                    .eq('status', 'pending');
                    
                return;
            }

            // 3. Mission Step Handling
            if (lead && lead.chatbot_mission_step === 'greeting_sent') {
                console.log(`[Chatbot] ${lead.name} replied to greeting. Moving to wait state.`);
                await db.supabase
                    .from('leads')
                    .update({ 
                        chatbot_mission_step: 'user_answered_greeting',
                        chatbot_last_contact_at: new Date().toISOString()
                    })
                    .eq('place_id', lead.place_id);
                
                await db.addLog('chatbot', 'mission_step_updated', lead.place_id, { step: 'user_answered_greeting' }, 'info');
                // We don't reply immediately, we wait 10 minutes (handled by script)
                return;
            }

            // 4. Handle Explicit Interest (Automated Trial Activation) - ONLY for known leads
            if (lead && intent === 'USER_INTERESTED' && (lead.status === 'scouted' || lead.status === 'warming_sent')) {
                console.log(`[Chatbot] Interest Confirmed for ${lead.name}. Activating Trial...`);
                await db.updateLeadStatus(lead.place_id, 'interest_confirmed', { 
                    trial_start_date: new Date().toISOString(),
                    updated_at: new Date().toISOString() 
                });
                
                const activationMsg = `Great choice, ${lead.name}! 💎 Your 1-week FREE trial is now being activated. 

We are finalizing your custom AI-powered website now. You will receive a link to your preview within the next 15-20 minutes!

---

خيار رائع، ${lead.name}! 💎 تجربة الأسبوع المجاني الخاصة بك قيد التفعيل الآن.

نحن نضع اللمسات الأخيرة على موقعك المخصص المدعوم بالذكاء الاصطناعي الآن. ستصلك رسالة تحتوي على رابط المعاينة خلال 15-20 دقيقة القادمة!`;

                const closer = new CloserAgent();
                await closer.sendMessage(incomingPhone, activationMsg);
                // Note: outbound log is handled automatically by whatsapp-service message_create event
                return; // Stop here, the Orchestrator will pick it up
            }

            // 4. For real user interactions, generate a contextual response
            const trainingLogs = await db.getTrainingLogs();

            let trainingContext = "Here are past examples of how you answered questions from leads. Mimic this style and factual information:\n";
            if (trainingLogs && trainingLogs.length > 0) {
                trainingLogs.forEach(log => {
                    const finalReply = log.status === 'corrected' && log.corrected_text
                        ? log.corrected_text
                        : log.message_out;

                    trainingContext += `User Asked: "${log.message_in}"\nYou Replied: "${finalReply}"\n\n`;
                });
            } else {
                trainingContext += "No past examples available. Use your best judgment.\n";
            }

            // Fallbacks for unknown numbers
            const businessName = lead ? lead.name : "Valued Business";
            const previewUrl = lead ? lead.vercel_url : "https://ksaverified.com/customers/login";
            const currentStatus = lead ? lead.status : "new inquiry";
            const missionStep = lead ? lead.chatbot_mission_step : null;

            // Script Branching Instructions
            let scriptInstructions = "";
            if (missionStep === 'website_query_sent' || missionStep === 'trial_offered') {
                scriptInstructions = `
                CURRENT MISSION CONTEXT:
                - If the person answered in Arabic, continue the entire conversation in Arabic.
                - If the person answered in English, ask if they are comfortable talking in English or prefer Arabic.
                - If they confirm they've seen the website: Offer a 1-week FREE TRIAL. Explain clearly that if they don't subscribe after the week, the service will be deactivated.
                - If they haven't seen it: Send them the preview link (${previewUrl}) and say you'll wait for them to check it and you're here to help.
                
                SPECIFIC OBJECTIONS:
                - "I can't see it / site blocked": Give them a 1-day unblock exception and message them about it.
                - "How much?": Mark their status as "Interest Confirmed" and offer the 1-month promotion for 19 SAR.
                - "How to pay?": Payment via STC Pay to 966507913514. They must send the receipt here for activation.
                - "Is it permanent?": Explain it's a prepaid model (like a phone credit). Service is active when paid, blocked when not. No extra charges.
                - "Can I change something?": We don't do modifications in this phase, but take their requirements and say we'll implement them as soon as possible.
                `;
            }

            const prompt = `
System Prompt:
You are the KSA Verified AI Sales Assistant, representing KSA Verified—a premium, automated web development and business intelligence agency. 

Your goal is to answer questions from local business owners (like ${businessName}) who messaged you.

${scriptInstructions}

NEW PROMOTION: 
- 1 Week FREE Trial: They can test the site for 7 days without paying. If they express interest, tell them their "Free Week" starts NOW.
- Promotion Price: Only 19 SAR for the first month (Normal price is 99 SAR).
- Annual Discount: 990 SAR per year (2 months free).

Payment Detail: Payment via STC Pay to +966 50 791 3514. 
Verification: Once paid, they must send a screenshot of the receipt here.
Dashboard: Manage site at https://ksaverified.com/customers (Login with WhatsApp number).
Preview Link: Always encourage them to check their preview at ${previewUrl} if they haven't already.

Be polite, professional, very concise, and speak in the language they used. If they speak Arabic, reply in Arabic.

Detected Intent: ${intent}

${trainingContext}

Current Lead Context:
- Business Name: ${businessName}
- Preview Link: ${previewUrl}
- Pipeline Status: ${currentStatus}

User's New Message to you:
"${messageText}"

Write the response you will send back exactly as it should appear in WhatsApp. Do not include quotes or meta-commentary.
            `;

            await db.addLog('chatbot', 'response_generation_started', placeId, { intent }, 'info');

            const replyText = await this.generateAI(prompt);
            
            if (!replyText) {
                console.error('[Chatbot] Failed to generate AI response.');
                return;
            }

            console.log(`[Chatbot] AI generated reply: ${replyText}`);

            // Send via CloserAgent
            const closer = new CloserAgent();
            await closer.sendMessage(incomingPhone, replyText);

            await db.addLog('chatbot', 'response_sent', placeId, { reply: replyText }, 'success');
            console.log(`[Chatbot] Reply sent to ${incomingPhone}`);

        } catch (error) {
            const placeId = lead ? (lead.place_id || null) : null;
            console.error(`[Chatbot] Error handling message (Lead: ${incomingPhone}):`, error.message);
            await db.addLog('chatbot', 'error', placeId, { message: error.message }, 'error');
        }
    }
}

module.exports = ChatbotAgent;
