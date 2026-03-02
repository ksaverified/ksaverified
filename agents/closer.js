const axios = require('axios');

/**
 * Closer Agent
 * Uses Ultramsg WhatsApp API to send the deployed website to the business owner.
 */
class CloserAgent {
    constructor() {
        this.instanceId = process.env.ULTRAMSG_INSTANCE_ID || '';
        this.token = process.env.ULTRAMSG_TOKEN || '';

        // Ultramsg requires both instance ID and token to work
        this.isConfigured = !!(this.instanceId && this.token);

        if (!this.isConfigured) {
            console.warn('[Closer] Ultramsg environment variables missing. WhatsApp pitching is disabled.');
        } else {
            // Set up common axios instance for cleaner code
            this.api = axios.create({
                baseURL: `https://api.ultramsg.com/${this.instanceId}/messages`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
        }
    }

    /**
     * Cleans and formats phone numbers to E.164 without the '+' for Ultramsg
     * Ultramsg expects mostly international format digits (e.g. 966568471238) optionally with @c.us
     * @param {string} rawPhone - The phone number scraped from Google Places
     * @returns {string} Formatted phone number
     */
    formatPhoneNumber(rawPhone) {
        // Remove all non-numeric characters
        let cleaned = rawPhone.replace(/\D/g, '');

        // If KSA local format (e.g., 056...), prepend country code
        if (cleaned.startsWith('05') && cleaned.length === 10) {
            cleaned = '966' + cleaned.substring(1);
        } else if (!cleaned.startsWith('966') && cleaned.length > 5 && cleaned.length < 10) {
            // Very roughly assuming it's a local KSA fixed line (e.g 9200...) or missing country code
            console.warn(`[Closer] Phone number ${rawPhone} doesn't look like international format. Passing to Ultramsg as is.`);
        }

        return cleaned;
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
            console.log(`[Closer] Skipped pitching ${businessName} - Ultramsg is purely optional and currently disabled.`);
            return null;
        }

        const formattedPhone = this.formatPhoneNumber(phone);
        console.log(`[Closer] Texting ${businessName} at ${formattedPhone} via Ultramsg...`);

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
            // Ultramsg expects URL encoded form data
            const params = new URLSearchParams();
            params.append('token', this.token);
            params.append('to', formattedPhone);
            params.append('body', messageBody);

            const response = await this.api.post('/chat', params);

            if (response.data && response.data.sent === 'true') {
                console.log(`[Closer] Successfully queued WhatsApp message via Ultramsg to ${formattedPhone} (MsgId: ${response.data.message.id})`);
                return response.data.message.id;
            } else {
                console.warn(`[Closer] Ultramsg accepted request but didn't confirm 'sent':`, response.data);
                return response.data?.message?.id || 'unknown_id'; // Fallback
            }

        } catch (error) {
            console.error(`[Closer] Error sending WhatsApp message via Ultramsg: ${error.message}`);
            if (error.response) {
                console.error('[Closer] Ultramsg Response:', error.response.data);
            }
            throw error;
        }
    }
}

module.exports = CloserAgent;
