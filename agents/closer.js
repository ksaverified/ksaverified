const axios = require('axios');
const gemini = require('../services/gemini');

/**
 * Closer Agent
 * Uses the custom local/cloud-run WhatsApp microservice to send messages.
 * Enhanced to support Marketing Image + Client Dashboard access details.
 */
class CloserAgent {
    constructor() {
        // Local WhatsApp service endpoint (Custom microservice)
        this.baseURL = process.env.WHATSAPP_SERVICE_URL || 'http://127.0.0.1:8081';

        // Set up axios instance for local service
        this.api = axios.create({
            baseURL: this.baseURL,
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000 // 60 second timeout for messaging (media can be slow)
        });

        console.log(`[Closer] Using Local WhatsApp service at ${this.baseURL}`);
        this.gemini = gemini;
        this.db = null; // Will be set by Orchestrator
    }

    /** Sets the database service for logging */
    setDatabase(db) {
        this.db = db;
    }

    /**
     * Cleans and formats phone numbers to international format (e.g., 966...)
     */
    formatPhoneNumber(rawPhone) {
        if (!rawPhone) return null;

        // If it's already a full WhatsApp ID (e.g. 966...@c.us or ...@lid), return as-is
        if (rawPhone.includes('@c.us') || rawPhone.includes('@lid')) {
            return rawPhone;
        }

        let cleaned = rawPhone.replace(/\D/g, '');

        // If it starts with 05 and is 10 digits, it's a local KSA mobile number
        if (cleaned.startsWith('05') && cleaned.length === 10) {
            cleaned = '966' + cleaned.substring(1);
        } else if (cleaned.length === 9 && (cleaned.startsWith('5'))) {
            // If it's 9 digits starting with 5, prepend 966
            cleaned = '966' + cleaned;
        }

        // Final check: Saudi mobile numbers must start with 9665 and have 12 digits
        if (cleaned.startsWith('9665') && cleaned.length === 12) {
            return cleaned;
        }

        console.warn(`[Closer] Skipping invalid or landline number: ${rawPhone}`);
        return null;
    }

    /**
     * Sends the pitch message via the local WhatsApp service
     */
    async pitchLead(businessName, phone, vercelUrl, db) {
        const formattedPhone = this.formatPhoneNumber(phone);
        if (!formattedPhone) return 'skipped_invalid';

        // 0. Pre-flight check: Verify the website is working AND validated before pitching
        if (db) {
            const lead = await db.getLeadByPhone(formattedPhone);
            if (lead && lead.is_validated !== true) {
                console.error(`[Closer] HARD BLOCK: Lead ${businessName} (${formattedPhone}) is NOT validated. Pitch aborted.`);
                throw new Error(`Website quality assurance check failed. Lead is not marked as validated in database. Please review the site manually or run AuditorAgent.`);
            }
        }

        if (vercelUrl) {
            console.log(`[Closer] Performing pre-flight check on URL: ${vercelUrl}`);
            try {
                const response = await axios.get(vercelUrl, {
                    timeout: 20000,
                    maxRedirects: 5,
                    validateStatus: (status) => status < 500 // Accept 2xx, 3xx, 4xx — only reject 5xx
                });
                console.log(`[Closer] Pre-flight check passed (status: ${response.status}). Site is up.`);
            } catch (err) {
                // Only hard-block on genuine connection failures, not HTTP errors
                const isConnectionError = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ECONNRESET';
                if (isConnectionError) {
                    console.error(`[Closer] CRITICAL: Pre-flight connection failure for ${vercelUrl}. Error: ${err.message}`);
                    throw new Error(`Website at ${vercelUrl} is not working or unreachable. Pitch aborted to prevent sending broken links.`);
                }
                // Timeout or other transient errors: warn but allow pitch through
                console.warn(`[Closer] Pre-flight check warning (non-fatal): ${err.message}. Proceeding with pitch.`);
            }
        }

        // 1. Ensure lead exists and generate/retrieve PIN
        let registrationData = { pin: '000000' };
        try {
            const authService = require('../services/auth');
            registrationData = await authService.registerLead({ name: businessName, phone: formattedPhone });
            console.log(`[Closer] Lead ${formattedPhone} ready with PIN: ${registrationData.pin}`);
        } catch (dbErr) {
            console.warn(`[Closer] Registration failed: ${dbErr.message}.`);
        }

        console.log(`[Closer] Sending Enhanced Pitch for ${businessName}...`);

        // Image and Portal details
        // Use a reliable, always-online marketing image. Replace with CDN-hosted asset once available.
        const marketingImageUrl = process.env.MARKETING_IMAGE_URL || 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
        const portalUrl = 'https://ksaverified.com/customers';

        let templates;
        try {
            templates = await db.getSetting('whatsapp_template');
        } catch (e) {
            templates = {
                en: "Hello {businessName}! 💎 We built a premium preview for your new website: {previewUrl}\n\nManage your site at your KSA Verified Portal: {portalUrl}\n\nYour Login Credentials:\nPhone: {phone}\nTemporary Password: *{password}*",
                ar: "مرحباً {businessName}! 💎 لقد قمنا بإنشاء معاينة متميزة لموقعك الإلكتروني الجديد: {previewUrl}\n\nأدر موقعك من خلال بوابة KSA Verified: {portalUrl}\n\nبيانات تسجيل الدخول الخاصة بك:\nرقم الجوال: {phone}\nكلمة المرور المؤقتة: *{password}*",
                en_returning: "Welcome back {businessName}! 💎 We updated your premium preview: {previewUrl}\n\nAccess your KSA Verified Portal with your new temporary password.\n\nPortal: {portalUrl}\nPhone: {phone}\nNew Password: *{password}*",
                ar_returning: "مرحباً بعودتك {businessName}! 💎 لقد قمنا بتحديث معاينتك المتميزة: {previewUrl}\n\nيمكنك الوصول إلى بوابة KSA Verified بكلمة المرور المؤقتة الجديدة.\n\nالبوابة: {portalUrl}\nرقم الجوال: {phone}\nكلمة المرور الجديدة: *{password}*"
            };
        }

        const buildMessage = (template, name, url, portal, phoneNum, pass) => {
            if (!template) return '';
            return template
                .replace(/{businessName}/g, name)
                .replace(/{previewUrl}/g, url)
                .replace(/{portalUrl}/g, portal)
                .replace(/{phone}/g, phoneNum)
                .replace(/{password}/g, pass);
        };

        const msgEn = buildMessage(
            registrationData.isNew ? templates.en : (templates.en_returning || "Welcome back {businessName}! 💎 We've updated your premium preview: {previewUrl}\n\nAccess your portal with your new temporary password.\n\nPortal: {portalUrl}\nPhone: {phone}\nNew Password: *{password}*"),
            businessName, vercelUrl, portalUrl, formattedPhone, registrationData.pin
        );
        const msgAr = buildMessage(
            registrationData.isNew ? templates.ar : (templates.ar_returning || "مرحباً بعودتك {businessName}! 💎 لقد قمنا بتحديث المعاينة المتميزة الخاصة بك: {previewUrl}\n\nيمكنك الوصول إلى البوابة الخاصة بك باستخدام كلمة المرور المؤقتة الجديدة.\n\nالبوابة: {portalUrl}\nرقم الجوال: {phone}\nكلمة المرور الجديدة: *{password}*"),
            businessName, vercelUrl, portalUrl, formattedPhone, registrationData.pin
        );
        const messageBody = `${msgEn}\n\n---\n\n${msgAr}`;

        try {
            // 1. Send Marketing Image FIRST — non-fatal if it fails
            console.log(`[Closer] Step 1: Sending marketing image to ${formattedPhone}...`);
            try {
                await this.sendMedia(formattedPhone, marketingImageUrl, "KSA Verified 💎");
            } catch (imgErr) {
                console.warn(`[Closer] Marketing image failed (non-fatal): ${imgErr.message}. Continuing with text pitch.`);
            }

            // 2. Send the Access Details message SECOND
            await this.sendMessage(formattedPhone, messageBody, lead?.place_id);

            console.log(`[Closer] Enhanced Pitch successfully delivered to ${formattedPhone}`);
            return 'local_sent';
        } catch (err) {
            console.error(`[Closer] Enhanced outreach failed for ${formattedPhone}: ${err.message}`);
            throw new Error(`Enhanced Outreach Failed: ${err.message}`);
        }
    }

    /**
     * Tries to find the business on another search engine organic results (Bing)
     * Returns true if it looks missing, false if found.
     */
    async _isMissingOnBing(businessName) {
        try {
            const query = `${businessName} Riyadh`;
            const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
            // Use local API for simple fetch to avoid messing with user-agent logic, or direct axios
            const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });
            const html = response.data.toLowerCase();
            const nameParts = businessName.toLowerCase().split(' ').filter(p => p.length > 3);
            const isMissing = nameParts.length > 0 && !nameParts.some(part => html.includes(part));
            return isMissing;
        } catch (err) {
            return false; // Safely default to 'found' if Bing errors out
        }
    }

    /**
     * Converts a Google Place type to a friendly niche string for messaging.
     */
    formatNiche(types) {
        if (!types || !Array.isArray(types) || types.length === 0) {
            return { en: 'businesses like yours', ar: 'أعمال مشابهة لعملكم' };
        }
        
        const primary = types[0] || '';
        
        const dictionary = {
            'restaurant': { en: 'a restaurant', ar: 'مطعم' },
            'cafe': { en: 'a cafe', ar: 'مقهى' },
            'coffee_shop': { en: 'a coffee shop', ar: 'مقهى' },
            'bakery': { en: 'a bakery', ar: 'مخبز' },
            'car_repair': { en: 'a car repair shop', ar: 'ورشة صيانة سيارات' },
            'car_wash': { en: 'a car wash', ar: 'مغسلة سيارات' },
            'mechanic': { en: 'a mechanic', ar: 'ميكانيكي سيارات' },
            'gym': { en: 'a gym', ar: 'صالة رياضية' },
            'hair_care': { en: 'a hair salon', ar: 'صالون حلاقة' },
            'beauty_salon': { en: 'a beauty salon', ar: 'صالون تجميل' },
            'laundry': { en: 'a laundry service', ar: 'مغسلة ملابس' },
            'clothing_store': { en: 'a clothing store', ar: 'متجر ملابس' },
            'supermarket': { en: 'a supermarket', ar: 'سوبر ماركت' },
            'grocery_or_supermarket': { en: 'a grocery store', ar: 'بقالة' },
            'health_beauty': { en: 'a health and beauty store', ar: 'متجر صحة وجمال' },
            'hospital': { en: 'a hospital', ar: 'مستشفى' },
            'clinic': { en: 'a clinic', ar: 'عيادة' },
            'dentist': { en: 'a dental clinic', ar: 'عيادة أسنان' },
            'pharmacy': { en: 'a pharmacy', ar: 'صيدلية' },
            'real_estate_agency': { en: 'a real estate agency', ar: 'مكتب عقارات' },
            'travel_agency': { en: 'a travel agency', ar: 'وكالة سفر' },
            'lawyer': { en: 'a law firm', ar: 'مكتب محاماة' },
            'plumber': { en: 'a plumber', ar: 'سباك' },
            'electrician': { en: 'an electrician', ar: 'كهربائي' }
        };
        
        if (dictionary[primary]) {
            return dictionary[primary];
        }
        
        const friendlyName = primary.replace(/_/g, ' ');
        return { 
            en: `a ${friendlyName}`, 
            ar: `مجال ${friendlyName}`
        };
    }

    /**
     * Sends a "Lead Warming" text to confirm interest before expensive generation.
     */
    async warmLead(lead) {
        const businessName = lead.name;
        const formattedPhone = this.formatPhoneNumber(lead.phone);
        if (!formattedPhone) return 'skipped_invalid';
        
        const niche = this.formatNiche(lead.types);
        
        let messageEn = '';
        let messageAr = '';

        console.log(`[Closer] Warming lead ${formattedPhone}. Checking secondary search engines for gaps...`);
        const isMissingOnBing = await this._isMissingOnBing(businessName);

        if (isMissingOnBing) {
            console.log(`[Closer] Huge Gap Identified: Not found organically on Bing.`);
            messageEn = `Hi ${businessName}. I saw your listing on Google Maps, but when I searched on other platforms (like Bing) for ${niche.en} in Riyadh, your business didn't show up at all.

I know that's probably not at the top of your priority list when you're busy actually running your business, but missing from these other directories might be costing you more customers than you think.

Happy to share the exact gaps I found if you're open to it.`;

            messageAr = `مرحباً ${businessName}. رأيت قائمتكم على خرائط جوجل، ولكن عندما بحثت في منصات أخرى (مثل Bing) عن ${niche.ar} في الرياض، لم يظهر عملكم على الإطلاق.

أعلم أن هذا ربما لا يكون على رأس قائمة أولوياتكم مع انشغالكم الفعلي بإدارة العمل، لكن الغياب عن أدلة البحث الأخرى قد يكلفكم خسارة عملاء أكثر مما تعتقدون.

سأكون سعيداً بمشاركة ما وجدته بالضبط إذا كنتم منفتحين لذلك.`;

        } else {
            // Default Gap: Missing Website (since they were scouted with no website)
            messageEn = `Hi ${businessName}. I was trying to find your website when searching for ${niche.en} in Riyadh online, but I couldn't find one. 

I know that's probably not at the top of your priority list when you're busy actually running your business, but it might be costing you more customers than you think. 

Happy to share what I found if you're open to it.`;

            messageAr = `مرحباً ${businessName}. كنت أحاول العثور على موقعكم الإلكتروني أثناء البحث عن ${niche.ar} في الرياض عبر الإنترنت، لكنني لم أتمكن من العثور عليه.

أعلم أن هذا ربما لا يكون على رأس قائمة أولوياتكم مع انشغالكم الفعلي بإدارة العمل، لكن هذا الأمر قد يكلفكم خسارة عملاء أكثر مما تعتقدون.

سأكون سعيداً بمشاركة ما وجدته معكم إذا كنتم منفتحين لذلك.`;
        }

        const message = `${messageEn}\n\n---\n\n${messageAr}`;

        return await this.sendMessage(formattedPhone, message, lead.place_id || null);
    }

    /**
     * Sends the "1 Week Free + 19 SAR" promotion to existing leads.
     */
    async sendPromotion(businessName, phone, vercelUrl, db) {
        const formattedPhone = this.formatPhoneNumber(phone);
        if (!formattedPhone) return 'skipped_invalid';

        // Enforce validation check for promotions too
        if (db) {
            const lead = await db.getLeadByPhone(formattedPhone);
            if (lead && lead.is_validated !== true) {
                console.error(`[Closer] HARD BLOCK: Lead ${businessName} (${formattedPhone}) is NOT validated. Promotion aborted.`);
                return 'skipped_unvalidated';
            }
        }

        const promoImageUrl = process.env.PROMO_IMAGE_URL || 'https://ksaverified.com/marketing/promo_19sar.png';
        const portalUrl = 'https://ksaverified.com/customers';

        const message = `Special Offer for ${businessName}! 🚀 

We are launching a new promotion: Get 1 Week FREE to test your site, then pay only 19 SAR for the first month! (Normal price 99 SAR).

Check your site here: ${vercelUrl}
Manage everything in your portal: ${portalUrl}

Reply 'INTERESTED' to activate this offer!

---

عرض خاص لـ ${businessName}! 🚀

نحن نطلق عرضاً جديداً: احصل على أسبوع مجاني لاختبار موقعك، ثم ادفع 19 ريالاً فقط للشهر الأول! (السعر العادي 99 ريال).

تحقق من موقعك هنا: ${vercelUrl}
إدارة كل شيء في البوابة الخاصة بك: ${portalUrl}

رد بـ "مهتم" لتفعيل هذا العرض!`;

        console.log(`[Closer] Sending 19 SAR Promo to ${formattedPhone}...`);
        try {
            await this.sendMedia(formattedPhone, promoImageUrl, "Flash Sale: 1 Week FREE + 19 SAR 🚀");
            const lead = await db.getLeadByPhone(formattedPhone);
            await this.sendMessage(formattedPhone, message, lead?.place_id);
            return true;
        } catch (err) {
            console.error(`[Closer] Promo send failed: ${err.message}`);
            throw err;
        }
    }


    /**
     * Generic method to send a message via the local WhatsApp service
     */
    async sendMessage(to, message, placeId = null) {
        try {
            const response = await this.api.post('/send', { to, message });
            
            // Log to database if available
            if (this.db) {
                try {
                    await this.db.saveOutboundChatLog(to, message, placeId);
                } catch (logErr) {
                    console.warn(`[Closer] Logging failed: ${logErr.message}`);
                }
            }

            if (response.data && response.data.success) return true;
            throw new Error(response.data?.error || 'Unknown error');
        } catch (error) {
            const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            throw new Error(`Text send failed: ${errorDetails}`);
        }
    }

    /**
     * Generic method to send media via the local WhatsApp service
     */
    async sendMedia(to, mediaUrl, caption) {
        try {
            const response = await this.api.post('/send-media', { to, mediaUrl, caption });
            if (response.data && response.data.success) return true;
            throw new Error(response.data?.error || 'Unknown error');
        } catch (error) {
            const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            throw new Error(`Media send failed: ${errorDetails}`);
        }
    }

    /**
     * Sends a bilingual trial expiration reminder.
     * @param {Object} lead - The lead record from DB
     * @param {number} daysRemaining - Days left (e.g., 2 or 1)
     */
    async sendTrialReminder(lead, daysRemaining) {
        const formattedPhone = this.formatPhoneNumber(lead.phone);
        if (!formattedPhone) return false;

        const portalUrl = 'https://ksaverified.com/customers';
        const stcPayDetails = 'STC Pay: +966 50 791 3514';

        const messageEn = `Hi ${lead.name}! 💎 Your 1-week FREE trial expires in *${daysRemaining} day${daysRemaining > 1 ? 's' : ''}*. 

To keep your premium AI website active and published, you can now activate your subscription for only *19 SAR* for the first month! (Normal price 99 SAR).

Check your site: ${lead.vercel_url}
Payment: ${stcPayDetails}
Portal: ${portalUrl}

Please send a screenshot of your payment receipt here to finalize your activation! 🚀`;

        const messageAr = `مرحباً ${lead.name}! 💎 تنتهي تجربة الأسبوع المجاني الخاصة بك خلال *${daysRemaining} يوم*.

لإبقاء موقعك المتميز المدعوم بالذكاء الاصطناعي نشطاً ومنشوراً، يمكنك الآن تفعيل اشتراكك مقابل *19 ريال فقط* للشهر الأول! (السعر العادي 99 ريال).

تحقق من موقعك: ${lead.vercel_url}
الدفع: ${stcPayDetails}
البوابة: ${portalUrl}

يرجى إرسال لقطة شاشة لإيصال الدفع هنا لإتمام التفعيل! 🚀`;

        const messageBody = `${messageEn}\n\n---\n\n${messageAr}`;

        console.log(`[Closer] Sending ${daysRemaining}-day Trial Reminder to ${formattedPhone}...`);
        try {
            await this.sendMessage(formattedPhone, messageBody, lead.place_id);
            return true;
        } catch (err) {
            console.error(`[Closer] Trial reminder failed for ${formattedPhone}: ${err.message}`);
            throw err;
        }
    }

    /**
     * Sends a highly personalized urgency close message using Gemini AI.
     * Targeted at Group D leads (Interest confirmed but no payment).
     */
    async sendUrgencyClose(lead) {
        const formattedPhone = this.formatPhoneNumber(lead.phone);
        if (!formattedPhone) return 'skipped_invalid';

        const portalUrl = 'https://ksaverified.com/customers';
        const stcPay = '+966 50 791 3514';

        console.log(`[Closer] Generating personalized Urgency Close for ${lead.name}...`);
        
        const context = `URGENCY CLOSE: The lead confirmed interest in a website but hasn't paid yet. 
        Their site is already live at ${lead.vercel_url}. 
        We are offering the first month for just 19 SAR (discount from 99 SAR). 
        They must pay via STC Pay to ${stcPay} and send a screenshot.`;

        let messageBody = await this.gemini.generateSalesMessage(lead, context);

        if (!messageBody) {
            console.warn(`[Closer] Gemini failed for Urgency Close. Using fallback template for ${lead.name}.`);
            const msgEn = `${lead.name}, your FREE trial is active! ⏰ Don't miss this offer:\n\n✅ First month: Only *19 SAR* (Normal: 99 SAR)\n✅ Your site: ${lead.vercel_url || 'Ready for you!'}\n✅ Payment: STC Pay to ${stcPay}\n\nSend your payment screenshot here to activate instantly! 🚀\nPortal: ${portalUrl}`;
            const msgAr = `${lead.name}، تجربتك المجانية نشطة! ⏰ لا تفوّت هذا العرض:\n\n✅ الشهر الأول: *19 ريال فقط* (السعر العادي: 99 ريال)\n✅ موقعك: ${lead.vercel_url || 'جاهز لك!'}\n✅ الدفع: STC Pay على ${stcPay}\n\nأرسل صورة الإيصال هنا للتفعيل الفوري! 🚀\nالبوابة: ${portalUrl}`;
            messageBody = `${msgEn}\n\n---\n\n${msgAr}`;
        }

        try {
            await this.sendMessage(formattedPhone, messageBody, lead.place_id);
            console.log(`[Closer] Urgency Close delivered to ${lead.name}`);
            return true;
        } catch (err) {
            console.error(`[Closer] Urgency Close failed for ${lead.name}: ${err.message}`);
            throw err;
        }
    }
}

module.exports = CloserAgent;
