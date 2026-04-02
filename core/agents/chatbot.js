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
        Analyze the following WhatsApp message from a local business owner and classify it into EXACTLY one of these categories:
        1. BUSINESS_AUTO_REPLY: Detailed business info, mission statements, "how can we help you", or "we are unavailable" messages that look like automatic responders.
        2. USER_INTERESTED: Positive responses like "YES", "I am interested", "show me", "نعم", "مهتم", "ارسل", or any variation expressing interest in the free trial or preview.
        3. USER_ASKING_PRICE: Any message about price, cost, how much, "كم السعر", "كم السعر", "بكم", "كم", "سعر", "how much", "price", "what does it cost".
        4. USER_WANTS_LINK: Asking for the website link, "أرسل الرابط", "send the link", "where is my site", "show me the website", "أين الموقع".
        5. USER_PAYMENT_SENT: Sending a payment receipt, "تم الدفع", "حولت", "paid", "I paid", "payment done", "تفضل الإيصال", or describing a bank transfer.
        6. USER_QUESTION: A real person asking a specific question about features, services, or the website.
        7. USER_GREETING: Just saying hi, hello, or sending emojis like 🙏 or 👍.
        8. USER_NEGATIVE: Stop, don't message me, annoy, block, لا أريد, etc.
        9. OTHER: Anything else.

        Message: "${messageText}"

        Return ONLY the category name. No explanations.
        `;

        const result = await this.generateAI(prompt);
        const intent = result ? result.trim().toUpperCase().replace(/[^A-Z_]/g, '') : 'UNKNOWN';
        console.log(`[Chatbot] Classified intent: ${intent}`);
        return intent;
    }

    /**
     * Close a conversion: mark lead as converted and send congratulations.
     */
    async closeConversion(lead, db, incomingPhone) {
        if (!lead) return;
        console.log(`[Chatbot] 🎉 CONVERSION DETECTED for ${lead.name}!`);

        // Update lead status
        await db.supabase.from('leads').update({
            status: 'completed',
            converted_at: new Date().toISOString(),
            free_week_status: 'paid'
        }).eq('place_id', lead.place_id);

        await db.addLog('chatbot', 'conversion_closed', lead.place_id, { name: lead.name }, 'success');

        const siteName = lead.name;
        const portalUrl = 'https://ksaverified.com/customers';

        const msgEn = `🎉 Congratulations, ${siteName}!

Your KSA Verified subscription is now ACTIVE!

✅ Your website: ${lead.vercel_url || 'Will be live within minutes!'}
✅ Manage your site: ${portalUrl}
   └ Login with your WhatsApp number: +${incomingPhone}

Welcome to the KSA Verified family! 🌟
Our team will review your payment and confirm within 1 hour.`;

        const msgAr = `🎉 مبروك، ${siteName}!

اشتراكك في KSA Verified أصبح الآن *نشطاً*!

✅ موقعك: ${lead.vercel_url || 'سيكون جاهزاً خلال دقائق!'}
✅ إدارة موقعك: ${portalUrl}
   └ سجّل الدخول برقم واتساب: +${incomingPhone}

أهلاً بك في عائلة KSA Verified! 🌟
سيراجع فريقنا دفعتك ويؤكد خلال ساعة واحدة.`;

        const closer = new CloserAgent();
        await closer.sendMessage(incomingPhone, `${msgEn}\n\n---\n\n${msgAr}`);
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

            // 4a. Payment Detected → CLOSE THE CONVERSION
            if (intent === 'USER_PAYMENT_SENT') {
                await this.closeConversion(lead, db, incomingPhone);
                return;
            }

            // 4b. Asking for Price → Immediate scripted close with 19 SAR offer
            if (intent === 'USER_ASKING_PRICE') {
                const stcPay = '+966 50 791 3514';
                const portalUrl = 'https://ksaverified.com/customers';
                const siteName = lead ? lead.name : 'صاحب المشروع';
                const msgEn = `Great question, ${siteName}! 💎\n\nChoose the best Gap Optimization plan for your business:\n✅ **Basic Plan** (19 SAR/mo): Fix minor gaps, missing info, and update hours. Perfect to start.\n✅ **Pro Plan** (49 SAR/mo): Includes a Custom Auto-Generated Website + Website Editor + Basic Plan.\n✅ **Max Plan** (99 SAR/mo): Includes Advanced SEO Analytics + Pro Plan.\n\n💳 Payment: STC Pay to ${stcPay}\nSend your receipt here to activate instantly! 🚀\nManage your profile gaps: ${portalUrl}`;
                const msgAr = `سؤال ممتاز، ${siteName}! 💎\n\nاختر خطة تحسين النواقص الأنسب لعملك:\n✅ **الباقة الأساسية** (19 ريال/شهر): إصلاح النواقص والمعلومات المفقودة وتحديث الأوقات. ممتازة كبداية.\n✅ **باقة برو** (49 ريال/شهر): تتضمن موقع إلكتروني مخصص + أداة تعديل الموقع + الباقة الأساسية.\n✅ **باقة ماكس** (99 ريال/شهر): تتضمن تحليلات متقدمة وإدارة SEO + باقة برو.\n\n💳 الدفع: STC Pay على ${stcPay}\nأرسل الإيصال هنا للتفعيل الفوري! 🚀\nإدارة نواقص ملفك: ${portalUrl}`;

                const closer = new CloserAgent();
                await closer.sendMessage(incomingPhone, `${msgEn}\n\n---\n\n${msgAr}`);
                if (lead) {
                    await db.updateLeadStatus(lead.place_id, 'interest_confirmed', {});
                    await db.supabase.from('leads').update({ last_retargeted_at: new Date().toISOString() }).eq('place_id', lead.place_id);
                }
                await db.addLog('chatbot', 'price_inquiry_handled', lead?.place_id, { intent }, 'success');
                return;
            }

            // 4c. Wants Link → Send it immediately
            if (intent === 'USER_WANTS_LINK') {
                const msgEn = `Here's your comprehensive Gap Analysis Report, ${lead?.name || 'Business Owner'}! 📊\n\n👉 https://ksaverified.com/customers \n\nTake a look to see exactly what you're missing on Google Maps and how fixing it can bring you more customers! ✨`;
                const msgAr = `إليك التقرير الشامل لنواقص ملفك، ${lead?.name || 'صاحب العمل'}! 📊\n\n👉 https://ksaverified.com/customers \n\nألقِ نظرة لترى بالضبط ما ينقصك على خرائط جوجل وكيف يمكن أن يجلب لك إصلاحه المزيد من العملاء! ✨`;

                const closer = new CloserAgent();
                await closer.sendMessage(incomingPhone, `${msgEn}\n\n---\n\n${msgAr}`);
                await db.addLog('chatbot', 'link_sent', lead.place_id, { url: lead.vercel_url }, 'success');
                return;
            }

            // 4d. Handle Explicit Interest (Automated Trial Activation) - ONLY for known leads
            if (lead && intent === 'USER_INTERESTED' && (lead.status === 'scouted' || lead.status === 'warming_sent')) {
                console.log(`[Chatbot] Interest Confirmed for ${lead.name}. Activating Trial...`);
                await db.updateLeadStatus(lead.place_id, 'interest_confirmed', { 
                    trial_start_date: new Date().toISOString(),
                    updated_at: new Date().toISOString() 
                });
                
                const activationMsg = `Great choice, ${lead.name}! 💎 

Our team is reviewing your gap analysis and will begin optimizing your Google Maps profile to fix the missing information (phone, hours, website, etc). 

You can check the live progress on your portal: https://ksaverified.com/customers

---

خيار رائع، ${lead.name}! 💎 

يقوم فريقنا بمراجعة تحليل النواقص الخاص بك وسيبدأ في تحسين ملفك على خرائط جوجل لإصلاح المعلومات المفقودة (الهاتف، ساعات العمل، الموقع الإلكتروني، وغيرها).

يمكنك متابعة التقدم المباشر على بوابتك: https://ksaverified.com/customers`;

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
            const isValidated = lead ? (lead.is_validated === true) : false;
            const previewUrl = (lead && isValidated) ? lead.vercel_url : null;
            const currentStatus = lead ? lead.status : "new inquiry";
            const missionStep = lead ? lead.chatbot_mission_step : null;

            // Script Branching Instructions
            let scriptInstructions = "";
            if (missionStep === 'website_query_sent' || missionStep === 'trial_offered' || missionStep === 'gap_pitch_sent') {
                scriptInstructions = `
                CURRENT MISSION CONTEXT:
                - If the person answered in Arabic, continue the entire conversation in Arabic.
                - If the person answered in English, ask if they are comfortable talking in English or prefer Arabic.
                - Emphasize that fixing Google Maps gaps (missing info, unread reviews) leads to direct customer increase.
                - If they ask for proof or what gaps they have: tell them to check the comprehensive audit report on our portal.
                - IF YOU HAVE ANY DOUBTS OR THEY ASK COMPLEX QUESTIONS: Tell them "Let me escalate this to our human administration team, they will review your profile and reply to you on this chat shortly." and then politely wait. Do NOT guess.
                
                SPECIFIC OBJECTIONS:
                - "I don't care about Google Maps / Internet": Remind them that a huge percentage of their competitors are getting customers because their profile is complete.
                - "How much?": Mark their status as "Interest Confirmed" and offer the Basic (19 SAR), Pro (49 SAR) and Max (99 SAR) subscriptions. Suggest the plan that best fits their gaps.
                - "How to pay?": Payment via STC Pay to 966507913514. They must send the receipt here for activation.
                `;
            } else {
                scriptInstructions = `
                ESCALATION INSTRUCTION:
                - IF YOU HAVE ANY DOUBTS OR THEY ASK COMPLEX QUESTIONS: Tell them "Let me escalate this to our human administration team, they will review your profile and reply to you on this chat shortly." and then politely wait. Do NOT guess.
                `;
            }

            const prompt = `
System Prompt:
You are the KSA Verified AI Sales Assistant, representing KSA Verified—a premium, automated web development and business intelligence agency. 

Your goal is to answer questions from local business owners (like ${businessName}) who messaged you.

${scriptInstructions}
PRICING TIERS: 
- Basic Plan (19 SAR/Mo): Fix minor maps gaps (info, reviews, hours)
- Pro Plan (49 SAR/Mo): Includes Custom Website, Website Editor & Basic Plan
- Max Plan (99 SAR/Mo): Includes Advanced Analytics, SEO Management & Pro Plan
Payment Detail: Payment via STC Pay to +966 50 791 3514. 
Verification: Once paid, they must send a screenshot of the receipt here.
Dashboard: Manage profile at https://ksaverified.com/customers (Login with WhatsApp number).

Be polite, professional, very concise, and speak in the language they used. If they speak Arabic, reply in Arabic.

Detected Intent: ${intent}

${trainingContext}

Current Lead Context:
- Business Name: ${businessName}
- Preview Link: ${previewUrl || 'Under Quality Review'}
- Pipeline Status: ${currentStatus}
- Quality Validated: ${isValidated ? 'YES' : 'PENDING FINAL AUDIT'}

User's New Message:
"${messageText}"

IMPORTANT CLOSING INSTRUCTIONS:
- Always end your reply with ONE clear next action (CTA). Examples:
  - "Reply YES to activate your free trial!"
  - "Reply with your payment screenshot to activate instantly!"
  - "Check your site and tell me what you think!"
- Always mention the 3 subscriptions: Basic (19 SAR), Pro (49 SAR), and Max (99 SAR).
- Match the user's language (Arabic or English) throughout your entire response.

Write the response exactly as it should appear in WhatsApp. No quotes or meta-commentary.
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
