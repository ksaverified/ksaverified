const twilio = require('twilio');

/**
 * Closer Agent
 * Uses Twilio WhatsApp to send the deployed website to the business owner.
 */
class CloserAgent {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER; // Usually "whatsapp:+14155238886" for sandbox

        this.isConfigured = !!(this.accountSid && this.authToken && this.fromNumber);

        if (this.isConfigured) {
            this.client = twilio(this.accountSid, this.authToken);
        } else {
            console.warn('[Closer] Twilio environment variables missing. WhatsApp pitching is disabled.');
        }
    }

    /**
     * Cleans and formats phone numbers to E.164 required by Twilio
     * @param {string} rawPhone - The phone number scraped from Google Places
     * @returns {string} E.164 formatted phone number
     */
    formatPhoneNumber(rawPhone) {
        // Remove all non-numeric characters except '+'
        let cleaned = rawPhone.replace(/[^\\d+]/g, '');

        // If it doesn't start with '+', this needs country code logic.
        // Given the query context (e.g. Riyadh), you might default to +966 for KSA.
        if (!cleaned.startsWith('+')) {
            if (cleaned.startsWith('05')) {
                // KSA mobile number starting with 05
                cleaned = '+966' + cleaned.substring(1);
            } else if (cleaned.startsWith('966')) {
                cleaned = '+' + cleaned;
            } else {
                console.warn(`[Closer] Phone number ${rawPhone} doesn't look like international format. Proceeding anyway.`);
            }
        }

        return `whatsapp:${cleaned}`;
    }

    /**
     * Sends the pitch message with the live Vercel URL
     * @param {string} businessName - The formatted name of the business
     * @param {string} phone - The unformatted phone number
     * @param {string} vercelUrl - The deployed Vercel URL
     * @param {Object} db - Database Service instance
     */
    async pitchLead(businessName, phone, vercelUrl, db) {
        if (!this.isConfigured) {
            console.log(`[Closer] Skipped pitching ${businessName} - Twilio is purely optional and currently disabled.`);
            return null;
        }

        const formattedPhone = this.formatPhoneNumber(phone);
        console.log(`[Closer] Texting ${businessName} at ${formattedPhone}...`);

        let templates;
        try {
            templates = await db.getSetting('whatsapp_template');
        } catch (e) {
            templates = {
                en: "Hello {businessName}! We built a website for you: {previewUrl}",
                ar: "مرحباً {businessName}! لقد قمنا بإنشاء موقع إلكتروني لك: {previewUrl}"
            };
        }

        const buildMessage = (template, name, url) => {
            if (!template) return '';
            return template.replace(/{businessName}/g, name).replace(/{previewUrl}/g, url);
        };

        const msgEn = buildMessage(templates.en, businessName, vercelUrl);
        const msgAr = buildMessage(templates.ar, businessName, vercelUrl);

        // Combine bilingual message
        const messageBody = `${msgEn}\n\n---\n\n${msgAr}`;

        try {
            const message = await this.client.messages.create({
                body: messageBody,
                from: this.fromNumber,
                to: formattedPhone
            });

            console.log(`[Closer] Successfully sent WhatsApp message to ${formattedPhone} (SID: ${message.sid})`);
            return message.sid;
        } catch (error) {
            console.error(`[Closer] Error sending WhatsApp message: ${error.message} `);
            throw error;
        }
    }
}

module.exports = CloserAgent;
