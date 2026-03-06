const axios = require('axios');

/**
 * Sends a WhatsApp message using the Ultramsg API
 * @param {string} to - The full phone number in E164 format without '+' (e.g. 966500000000)
 * @param {string} body - The text message body
 * @returns {Promise<string>} The message ID if successful
 */
async function sendMessage(to, body) {
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID || '';
    const token = process.env.ULTRAMSG_TOKEN || '';

    if (!instanceId || !token) {
        console.warn('[Ultramsg Service] Environment variables missing. WhatsApp messages disabled.');
        return null;
    }

    const api = axios.create({
        baseURL: `https://api.ultramsg.com/${instanceId}/messages`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    try {
        const params = new URLSearchParams();
        params.append('token', token);
        params.append('to', to);
        params.append('body', body);

        const response = await api.post('/chat', params);

        if (response.data && response.data.sent === 'true') {
            return response.data.message.id;
        } else {
            console.warn(`[Ultramsg Service] API accepted request but didn't confirm 'sent':`, response.data);
            return response.data?.message?.id || 'unknown_id';
        }
    } catch (error) {
        console.error(`[Ultramsg Service] Error sending message: ${error.message}`);
        if (error.response) {
            console.error('[Ultramsg Service] API Response:', error.response.data);
        }
        throw error;
    }
}

/**
 * Sends an image message using the Ultramsg API
 * @param {string} to - The full phone number in E164 format without '+' (e.g. 966500000000)
 * @param {string} imageUrl - The public URL of the image
 * @param {string} caption - Optional caption for the image
 * @returns {Promise<string>} The message ID if successful
 */
async function sendImage(to, imageUrl, caption = "") {
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID || '';
    const token = process.env.ULTRAMSG_TOKEN || '';

    if (!instanceId || !token) return null;

    const api = axios.create({
        baseURL: `https://api.ultramsg.com/${instanceId}/messages`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    try {
        const params = new URLSearchParams();
        params.append('token', token);
        params.append('to', to);
        params.append('image', imageUrl);
        params.append('caption', caption);

        const response = await api.post('/image', params);
        return response.data?.message?.id || 'unknown_id';
    } catch (error) {
        console.error(`[Ultramsg Service] Error sending image: ${error.message}`);
        throw error;
    }
}

module.exports = { sendMessage, sendImage };
