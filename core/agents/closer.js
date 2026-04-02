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
     * Cleans up business names to remove bot-like suffixes
     */
    cleanBusinessName(name) {
        if (!name) return 'Your Business';
        let clean = name.replace(/[\(\)\[\]]/g, ''); // Remove brackets
        clean = clean.split(' - ')[0]; // Take first part of dash separators
        clean = clean.split(' | ')[0];
        
        // Remove common regional/branch suffixes (Case-insensitive)
        const suffixes = [
            / Riyadh$/i, / Jeddah$/i, / Dammam$/i, / Khobar$/i,
            / branch$/i, / main$/i, / office$/i,
            / store$/i, / shop$/i, / showroom$/i,
            / فرع$/i, / الرياض$/i, / جدة$/i, / الدمام$/i
        ];
        
        for (const suffix of suffixes) {
            clean = clean.replace(suffix, '');
        }
        
        return clean.trim();
    }

    /**
     * Determines the niche in Arabic and English for personalized templates
     */
    formatNiche(types) {
        const typeMap = {
            'restaurant': { en: 'Restaurant', ar: 'مطعم' },
            'cafe': { en: 'Cafe', ar: 'كافيه' },
            'gym': { en: 'Gym', ar: 'نادي رياضي' },
            'dentist': { en: 'Dental Clinic', ar: 'عيادة أسنان' },
            'barber_shop': { en: 'Barbershop', ar: 'صالون حلاقة' },
            'beauty_salon': { en: 'Beauty Salon', ar: 'مشغل نسائي' },
            'bakery': { en: 'Bakery', ar: 'مخبز' },
            'florist': { en: 'Flower Shop', ar: 'محل زهور' },
            'car_repair': { en: 'Auto Repair', ar: 'ورشة سيارات' },
            'car_wash': { en: 'Car Wash', ar: 'مغسلة سيارات' },
            'furniture_store': { en: 'Furniture Store', ar: 'معرض أثاث' },
            'spa': { en: 'Spa', ar: 'سبا ومركز استرخاء' },
            'book_store': { en: 'Bookstore', ar: 'مكتبة' },
            'optician': { en: 'Optician', ar: 'محل نظارات' },
            'electronics_store': { en: 'Electronics Store', ar: 'محل إلكترونيات' },
            'general_contractor': { en: 'Contracting Company', ar: 'شركة مقاولات' },
            'real_estate_agency': { en: 'Real Estate Agency', ar: 'مكتب عقارات' }
        };
        
        const primary = types?.[0];
        return typeMap[primary] || { en: 'your business', ar: 'عملكم' };
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
        let leadRecord = null;
        if (db) {
            try {
                leadRecord = await db.getLeadByPhone(formattedPhone);
                if (leadRecord && leadRecord.is_validated !== true) {
                    console.error(`[Closer] HARD BLOCK: Lead ${businessName} (${formattedPhone}) is NOT validated. Pitch aborted.`);
                    throw new Error(`Website quality assurance check failed. Lead is not marked as validated in database. Please review the site manually or run AuditorAgent.`);
                }
            } catch (err) {
                console.warn(`[Closer] Database lookup for ${formattedPhone} failed: ${err.message}. Proceeding with caution.`);
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
                const isConnectionError = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ECONNRESET';
                if (isConnectionError) {
                    console.error(`[Closer] CRITICAL: Pre-flight connection failure for ${vercelUrl}. Error: ${err.message}`);
                    throw new Error(`Website at ${vercelUrl} is not working or unreachable. Pitch aborted to prevent sending broken links.`);
                }
                console.warn(`[Closer] Pre-flight check warning (non-fatal): ${err.message}. Proceeding with pitch.`);
            }
        }

        // 1. Clean business name and determine niche
        const cleanedName = this.cleanBusinessName(businessName);
        const { en: nicheEn, ar: nicheAr } = this.formatNiche(leadRecord?.types || []);

        // 2. Check for previous pitch to prevent duplicates
        if (db && leadRecord) {
            const { data: previousMsgs } = await db.supabase
                .from('chat_logs')
                .select('id')
                .eq('place_id', leadRecord.place_id)
                .not('message_out', 'is', null)
                .limit(1);

            if (previousMsgs && previousMsgs.length > 0) {
                console.log(`[Closer] Lead ${cleanedName} already has outbound messages. Skipping initial pitch.`);
                return 'duplicate_skipped';
            }
        }

        // 3. Prepare Professional Template
        const sales_pitch = `السلام عليكم فريق ${cleanedName} 👋

معكم فريق KSA Verified المتخصص في التحول الرقمي للشركات في الرياض.

لقد قمنا بتصميم نموذج أولي لموقعكم الإلكتروني الجديد كجزء من مبادرة دعم الأعمال المحلية لدينا. نهدف لمساعدة ${nicheAr} الخاص بكم على التميز وجذب المزيد من العملاء عبر الإنترنت.

هل يمكننا إرسال رابط المعاينة لتلقي ملاحظاتكم؟

English Translation:
Hi ${cleanedName} team 👋

We are the KSA Verified team, specializing in digital transformation for businesses in Riyadh.

We've developed a custom website prototype for your ${nicheEn} as part of our local business initiative. Our goal is to help you stand out and attract more customers online.

May we share the preview link for your feedback?

Best regards,
KSA Verified Team`;

        try {
            console.log(`[Closer] Pitching ${cleanedName} (${formattedPhone}) via WhatsApp...`);
            
            // 4. Determine and send Niche-Specific Image
            const nicheImage = this.getNicheImage(leadRecord?.types || []);
            await this.sendMedia(formattedPhone, nicheImage, `Website Proposal for ${cleanedName} 🚀`);

            // 5. Send the text pitch
            const response = await this.sendMessage(formattedPhone, sales_pitch, leadRecord?.place_id);
            
            if (response === 'sent' || response === 'local_sent') {
                console.log(`[Closer] Professional pitch delivered to ${cleanedName}`);
                return 'local_sent';
            } else {
                throw new Error('Local WhatsApp service failed to confirm delivery');
            }
        } catch (err) {
            console.error(`[Closer] Pitch failed for ${cleanedName}: ${err.message}`);
            if (db && leadRecord) {
                await db.addLog('closer', 'pitch_failed', leadRecord.place_id, { error: err.message }, 'error');
            }
            throw err;
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
     * Cleans up business names to remove bot-like suffixes
     */
    cleanBusinessName(name) {
        if (!name) return 'Your Business';
        let clean = name.replace(/[\(\)\[\]]/g, ''); // Remove brackets
        clean = clean.split(' - ')[0]; // Take first part of dash separators
        clean = clean.split(' | ')[0];
        
        // Remove common regional/branch suffixes (Case-insensitive)
        const suffixes = [
            / Riyadh$/i, / Jeddah$/i, / Dammam$/i, / Khobar$/i,
            / branch$/i, / main$/i, / office$/i,
            / store$/i, / shop$/i, / showroom$/i,
            / فرع$/i, / الرياض$/i, / جدة$/i, / الدمام$/i
        ];
        
        for (const suffix of suffixes) {
            clean = clean.replace(suffix, '');
        }
        
        return clean.trim();
    }

    /**
     * Determines the niche in Arabic and English for personalized templates
     */
    formatNiche(types) {
        const typeMap = {
            'restaurant': { en: 'Restaurant', ar: 'مطعم' },
            'cafe': { en: 'Cafe', ar: 'كافيه' },
            'gym': { en: 'Gym', ar: 'نادي رياضي' },
            'dentist': { en: 'Dental Clinic', ar: 'عيادة أسنان' },
            'health': { en: 'Health and Wellness Clinic', ar: 'عيادة صحية' },
            'barber_shop': { en: 'Barbershop', ar: 'صالون حلاقة' },
            'beauty_salon': { en: 'Beauty Salon', ar: 'مشغل نسائي' },
            'bakery': { en: 'Bakery', ar: 'مخبز' },
            'florist': { en: 'Flower Shop', ar: 'محل زهور' },
            'car_repair': { en: 'Auto Repair', ar: 'ورشة سيارات' },
            'car_wash': { en: 'Car Wash', ar: 'مغسلة سيارات' },
            'furniture_store': { en: 'Furniture Store', ar: 'معرض أثاث' },
            'spa': { en: 'Spa', ar: 'سبا ومركز استرخاء' },
            'book_store': { en: 'Bookstore', ar: 'مكتبة' },
            'optician': { en: 'Optician', ar: 'محل نظارات' },
            'electronics_store': { en: 'Electronics Store', ar: 'محل إلكترونيات' },
            'electronics_repair': { en: 'Electronics Repair', ar: 'إصلاح إلكترونيات' },
            'clothing_store': { en: 'Boutique', ar: 'بوتيك ملابس' },
            'roastery': { en: 'Coffee Roastery', ar: 'محمصة قهوة' },
            'general_contractor': { en: 'Contracting Company', ar: 'شركة مقاولات' },
            'real_estate_agency': { en: 'Real Estate Agency', ar: 'مكتب عقارات' }
        };
        
        if (!types || !Array.isArray(types) || types.length === 0) {
            return { en: 'businesses like yours', ar: 'أعمال مشابهة لعملكم' };
        }
        
        const primary = types[0];
        return typeMap[primary] || { en: 'your business', ar: 'عملكم' };
    }

    /**
     * Returns a high-quality marketing image URL for a specific niche.
     * These are hosted via Pexels or KSA Verified's own CDN.
     */
    getNicheImage(types) {
        const imageMap = {
            'restaurant': 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
            'cafe': 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg',
            'gym': 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
            'dentist': 'https://images.pexels.com/photos/3845806/pexels-photo-3845806.jpeg',
            'bakery': 'https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg',
            'florist': 'https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg',
            'spa': 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg',
            'furniture_store': 'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg',
            'electronics_store': 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg',
            'electronics_repair': 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg',
            'optician': 'https://images.pexels.com/photos/3971231/pexels-photo-3971231.jpeg',
            'clothing_store': 'https://images.pexels.com/photos/1036856/pexels-photo-1036856.jpeg',
            'book_store': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg',
            'car_wash': 'https://images.pexels.com/photos/372810/pexels-photo-372810.jpeg',
            'roastery': 'https://images.pexels.com/photos/684941/pexels-photo-684941.jpeg',
            'barber_shop': 'https://images.pexels.com/photos/1319461/pexels-photo-1319461.jpeg'
        };
        
        const primary = types && types.length > 0 ? types[0] : 'default';
        return imageMap[primary] || 'https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg'; // Professional handshake fallback
    }

    /**
     * Sends a "Lead Warming" text using Map Gap methodology.
     * Based on the "Map Gap System" - leads with specific observations, positive first, no hard ask.
     */
    async warmLead(lead) {
        const cleanedName = this.cleanBusinessName(lead.name);
        const formattedPhone = this.formatPhoneNumber(lead.phone);
        if (!formattedPhone) return 'skipped_invalid';
        
        const niche = this.formatNiche(lead.types);
        
        console.log(`[Closer] Warming lead ${formattedPhone} using Map Gap methodology...`);

        // Use Map Gap style messages
        const { en, ar } = this.generateMapGapMessage(lead);
        const message = `${ar}\n\n---\n\n${en}`;

        return await this.sendMessage(formattedPhone, message, lead.place_id || null);
    }

    /**
     * Generate Map Gap style message based on lead's gap analysis.
     * Key principles from Map Gap System:
     * 1. Lead with specific observation about their business
     * 2. Say something positive before pointing out a problem
     * 3. Offer value before asking for anything
     * 4. Don't ask for a call - offer to share what you found
     */
    generateMapGapMessage(lead) {
        const cleanedName = this.cleanBusinessName(lead.name);
        const niche = this.formatNiche(lead.types);
        const hasWebsite = lead.website && lead.website.length > 0;
        const reviewCount = lead.reviewCount || 0;
        const rating = lead.rating || 0;
        const gapAnalysis = lead.mapGapAnalysis || {};
        const gaps = gapAnalysis.gaps || [];

        // If they have a website but have gaps
        if (hasWebsite) {
            const hasLowReviews = reviewCount < 20;
            const hasNoReviews = reviewCount < 5;
            const hasOutdatedSite = gaps.some(g => g.type === 'outdated_website');

            let observation = '';
            
            if (hasNoReviews) {
                observation = "I noticed your Google listing doesn't have any reviews yet, while competitors in your area typically have 20-100+";
            } else if (hasLowReviews) {
                observation = `Your business has ${reviewCount} reviews, which is solid, but competitors in your area often have 50+`;
            } else if (hasOutdatedSite) {
                observation = "I noticed your website could use a modern refresh to match today's mobile-first customers";
            } else if (rating > 0) {
                observation = `Your ${rating}-star rating shows you do great work, but I noticed some gaps that could be costing you customers`;
            } else {
                observation = "I found your business during a local search and noticed a few opportunities to capture more customers";
            }

            const en = `Hi ${cleanedName} team! 👋

I was searching for ${niche.en} in Riyadh and came across your business. ${hasNoReviews || hasLowReviews ? "You've got great potential!" : "Your business looks solid!"}

${observation}. I put together a quick breakdown if you'd like to see it. No charge, no strings. Just thought it might help.

Happy to share what I found if you're curious.

Best,
KSA Verified Team`;

            const ar = `مرحباً فريق ${cleanedName}! 👋

كنت أبحث عن ${niche.ar} في الرياض وعثرت على أعمالكم. ${hasNoReviews || hasLowReviews ? "لديكم إمكانيات رائعة!" : "أعمالكم تبدو صلبة!"}

${observation}. أعددت ملخصاً سريعاً إذا أحببتم رؤيته. بدون رسوم، بدون التزامات. فقط ظننت أنه قد يساعد.

يسعدني مشاركة ما وجدته إذا كنتم فضوليين.

مع أطيب التحيات،
فريق KSA Verified`;

            return { en, ar };
        }

        // If they DON'T have a website - the message is different
        const en = `Hi ${cleanedName} team! 👋

I was trying to find your website when searching for ${niche.en} in Riyadh, but I couldn't find one.

I know that's probably not at the top of your priority list when you're busy actually running your business, but it might be costing you more customers than you think.

Happy to share what I found if you're open to it.

Best,
KSA Verified Team`;

        const ar = `مرحباً فريق ${cleanedName}! 👋

كنت أحاول البحث عن موقعكم الإلكتروني عند البحث عن ${niche.ar} في الرياض، لكنني لم أجد واحداً.

أعلم أن هذا ربما ليس في أعلى قائمة أولوياتكم وأنتم مشغولون بإدارة عملكم، لكنه قد يكلفكم عملاء أكثر مما تظنون.

يسعدني مشاركة ما وجدته معكم إذا كنتم منفتحين على ذلك.

مع أطيب التحيات،
فريق KSA Verified`;

        return { en, ar };
    }

    /**
     * Generate a marketing audit message when lead responds and wants to see findings.
     * This is sent AFTER initial outreach - once they express interest.
     */
    async sendMarketingAudit(lead, auditReport, formattedPhone) {
        if (!formattedPhone) return 'skipped_invalid';

        const cleanedName = this.cleanBusinessName(lead.name);
        
        const en = `Hi ${cleanedName}! Great to hear from you! 🙏

As promised, here's what I found during my quick audit:

📊 Overall Score: ${auditReport.overallScore}/100

The main gaps I identified:
${auditReport.sections.gaps.gaps.slice(0, 3).map((g, i) => `${i + 1}. ${g.type} - ${g.description}`).join('\n')}

Based on these findings, I'd recommend starting with a professional website since that's typically the highest-impact fix for businesses like yours.

Would you like me to put together a custom proposal? No commitment - just want to help you capture more of those customers searching for ${this.formatNiche(lead.types).en} in your area!

Best,
KSA Verified Team`;

        const ar = `مرحباً ${cleanedName}! يسعدني التواصل معكم! 🙏

كما وعدتكم، إليكم ما وجدته خلال التدقيق السريع:

📊 النتيجة الإجمالية: ${auditReport.overallScore}/100

الفجوات الرئيسية التي حددتها:
${auditReport.sections.gaps.gaps.slice(0, 3).map((g, i) => `${i + 1}. ${g.type} - ${g.description}`).join('\n')}

بناءً على هذه النتائج، أوصي بالبدء بموقع إلكتروني احترافي لأنه عادة ما يكون الإصلاح الأكثر تأثيراً للأعمال مثلكم.

هل تحبون أن أجهز عرضاً مخصصاً؟ بدون التزام - فقط أريد مساعدتكم على جذب المزيد من العملاء الذين يبحثون عن ${this.formatNiche(lead.types).ar} في منطقتكم!

مع أطيب التحيات،
فريق KSA Verified`;

        const message = `${ar}\n\n---\n\n${en}`;
        return await this.sendMessage(formattedPhone, message, lead.place_id || null);
    }

    /**
     * Sends the "1 Week Free + 19 SAR" promotion to existing leads.
     */
    async sendPromotion(businessName, phone, vercelUrl, db) {
        const cleanedName = this.cleanBusinessName(businessName);
        const formattedPhone = this.formatPhoneNumber(phone);
        if (!formattedPhone) return 'skipped_invalid';

        // Enforce validation check for promotions too
        let leadRecord = null;
        if (db) {
            leadRecord = await db.getLeadByPhone(formattedPhone);
            if (leadRecord && leadRecord.is_validated !== true) {
                console.error(`[Closer] HARD BLOCK: Lead ${cleanedName} (${formattedPhone}) is NOT validated. Promotion aborted.`);
                return 'skipped_unvalidated';
            }
        }

        const promoImageUrl = process.env.PROMO_IMAGE_URL || 'https://ksaverified.com/marketing/promo_19sar.png';
        const portalUrl = 'https://ksaverified.com/customers';

        const message = `عرض خاص بمناسبة الإطلاق لـ ${cleanedName}! 🚀

نحن نطلق عرض KSA Verified المتميز:
✅ الباقة الأساسية: 19 ريالاً/شهرياً (إصلاح النواقص)
✅ باقة برو: 49 ريالاً/شهرياً (موقع مخصص + 19 ريال)
✅ باقة ماكس: 99 ريالاً/شهرياً (تحليلات متقدمة وإدارة SEO)

تحقق من موقعك ونواقصك هنا: ${portalUrl}

رد بـ "مهتم" لتفعيل هذا العرض وتحديد الترقية المناسبة لعملك!

(English Translation)
Special Launch Offer for ${cleanedName}! 🚀 

We are launching our KSA Verified promotion: 
✅ Basic Plan: 19 SAR/mo (Fix Gaps)
✅ Pro Plan: 49 SAR/mo (Custom Website + Basic)
✅ Max Plan: 99 SAR/mo (Advanced Analytics & SEO)

Check your gaps and site here: ${portalUrl}

Reply 'INTERESTED' to activate this offer and choose the best plan for you!`;

        console.log(`[Closer] Sending 19 SAR Promo to ${cleanedName}...`);
        try {
            await this.sendMedia(formattedPhone, promoImageUrl, "Flash Sale: 1 Week FREE + 19 SAR 🚀");
            await this.sendMessage(formattedPhone, message, leadRecord?.place_id);
            return true;
        } catch (err) {
            console.error(`[Closer] Promo send failed for ${cleanedName}: ${err.message}`);
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
        const cleanedName = this.cleanBusinessName(lead.name);
        const formattedPhone = this.formatPhoneNumber(lead.phone);
        if (!formattedPhone) return false;

        const portalUrl = 'https://ksaverified.com/customers';
        const stcPayDetails = 'STC Pay/Bank Transfer: +966 50 791 3514';

        const messageEn = `Hi ${cleanedName}! 💎 Your 1-week FREE trial on KSA Verified expires in *${daysRemaining} day${daysRemaining > 1 ? 's' : ''}*. 

To keep your professional AI website and gap optimizations live, you can now activate a permanent plan: Basic (19 SAR/mo), Pro (49 SAR/mo with Website), or Max (99 SAR/mo).

Check your site: ${lead.vercel_url}
Payment: ${stcPayDetails}
Portal: ${portalUrl}

Please send a screenshot of your payment receipt here to finalize your activation! 🚀`;

        const messageAr = `مرحباً ${lead.name}! 💎 تنتهي تجربة الأسبوع المجاني الخاصة بك خلال *${daysRemaining} يوم*.

لإبقاء موقعك المتميز المدعوم بالذكاء الاصطناعي وتحسينات النواقص نشطة، يمكنك الآن تفعيل إحدى الباقات: الأساسية (19 ريال)، برو (49 ريال مع موقع)، أو ماكس (99 ريال).

بوابتك لإدارة كل شيء: ${portalUrl}

يرجى إرسال لقطة شاشة لإيصال الدفع هنا لإتمام التفعيل! 🚀`;

        const messageBody = `${messageAr}\n\nEnglish Translation:\n${messageEn}`;

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
        const cleanedName = this.cleanBusinessName(lead.name);
        const formattedPhone = this.formatPhoneNumber(lead.phone);
        if (!formattedPhone) return 'skipped_invalid';

        const portalUrl = 'https://ksaverified.com/customers';
        const stcPay = '+966 50 791 3514';

        console.log(`[Closer] Generating personalized Urgency Close for ${cleanedName}...`);
        
        const context = `URGENCY CLOSE: The lead confirmed interest in a website but hasn't paid yet. 
        Their site is already live at ${lead.vercel_url}. 
        We are offering flexible plans starting at 19 SAR (Basic/Gaps) up to 49 SAR (Pro with Website) and 99 SAR (Max/SEO).
        They must pay via STC Pay to ${stcPay} and send a screenshot.`;

        let messageBody = await this.gemini.generateSalesMessage(lead, context);

        if (!messageBody) {
            console.warn(`[Closer] Gemini failed for Urgency Close. Using fallback template for ${cleanedName}.`);
            const msgEn = `${cleanedName} team, your KSA Verified trial is active! ⏰ Don't miss our launch offer:\n\n✅ Basic Plan: *19 SAR*\n✅ Pro Plan (+Website): *49 SAR*\n✅ Max Plan (+SEO): *99 SAR*\n✅ Payment: STC Pay to ${stcPay}\n\nSend your payment screenshot here to activate instantly! 🚀\nPortal: ${portalUrl}`;
            const msgAr = `فريق ${cleanedName}، تجربتكم في KSA Verified نشطة! ⏰ لا تفوتوا عرض الإطلاق:\n\n✅ الباقة الأساسية: *19 ريال*\n✅ باقة برو (+موقع): *49 ريال*\n✅ باقة ماكس (+SEO): *99 ريال*\n✅ الدفع: STC Pay على ${stcPay}\n\nأرسل صورة إيصال الدفع هنا للتفعيل الفوري! 🚀\nالبوابة: ${portalUrl}`;
            messageBody = `${msgAr}\n\nEnglish Translation:\n${msgEn}`;
        }

        try {
            await this.sendMessage(formattedPhone, messageBody, lead.place_id);
            console.log(`[Closer] Urgency Close delivered to ${cleanedName}`);
            return true;
        } catch (err) {
            console.error(`[Closer] Urgency Close failed for ${cleanedName}: ${err.message}`);
            throw err;
        }
    }
    /**
     * Sends a bilingual nudge / follow-up message to a lead who has seen the preview but not replied.
     */
    async sendNudge(lead) {
        const cleanedName = this.cleanBusinessName(lead.name);
        const formattedPhone = this.formatPhoneNumber(lead.phone);
        if (!formattedPhone) return 'skipped_invalid';

        console.log(`[Closer] Sending bilingual nudge to ${cleanedName}...`);

        const msgEn = `Hi ${cleanedName} team! 💎 Just checking in—did you have a chance to look at your new KSA Verified website preview?\n\n🔗 ${lead.vercel_url || 'Your preview is ready'}\n\nYour 1-week FREE trial is active! Let me know if you have any questions or would like to make any changes.`;
        const msgAr = `أهلاً فريق ${cleanedName}! 💎 أردنا التأكد فقط—هل أتيحت لكم الفرصة لمراجعة معاينة موقعكم الإلكتروني الجديد من KSA Verified؟\n\n🔗 ${lead.vercel_url || 'المعاينة جاهزة'}\n\nفترة التجربة المجانية لمدة أسبوع نشطة الآن! أخبرونا إذا كان لديكم أي استفسارات أو ترغبون في إجراء أي تعديلات.`;

        const messageBody = `${msgAr}\n\n(Translation Follows)\n\n${msgEn}`;

        try {
            await this.sendMessage(formattedPhone, messageBody, lead.place_id);
            console.log(`[Closer] Nudge delivered to ${cleanedName}`);
            return true;
        } catch (err) {
            console.error(`[Closer] Nudge failed for ${cleanedName}: ${err.message}`);
            throw err;
        }
    }
}

module.exports = CloserAgent;
