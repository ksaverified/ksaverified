const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
    const { action } = req.query;

    try {
        switch (action) {
            case 'request-password':
                return await handleRequestPassword(req, res);
            case 'record-login':
                return await handleRecordLogin(req, res);
            case 'unlock':
                return await handleUnlock(req, res);
            default:
                return res.status(400).json({ error: 'Invalid portal action' });
        }
    } catch (error) {
        console.error(`[Portal API Error: ${action}]`, error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

async function handleRequestPassword(req, res) {
    const { phone } = req.body;
    
    try {
        const authService = require('../services/auth');
        const formattedPhone = authService.formatPhone(phone);

        // 1. Fetch the lead to ensure they exist
        const { data: lead, error } = await supabase.from('leads').select('name').eq('phone', formattedPhone).single();
        if (error || !lead) {
            return res.status(404).json({ error: 'Lead not found in the system.' });
        }

        // 2. Generate a new PIN and update Supabase Auth
        const registrationData = await authService.registerLead({ name: lead.name, phone: formattedPhone });
        
        // 3. Send the PIN via WhatsApp Service
        const axios = require('axios');
        const waUrl = process.env.WHATSAPP_API_URL || 'http://127.0.0.1:8081';
        
        const message = `Hello ${lead.name}!\n\nYour secure KSA Verified Customer Portal login code is: *${registrationData.pin}*\n\nPlease enter this code to sign in.\n\n---\nمرحباً ${lead.name}!\n\nرمز تسجيل الدخول الآمن الخاص بك لبوابة عملاء KSA Verified هو: *${registrationData.pin}*\n\nيرجى إدخال هذا الرمز لتسجيل الدخول.`;
        
        await axios.post(`${waUrl}/send`, { to: formattedPhone, message: message });

        return res.status(200).json({ success: true, message: 'Login code sent via WhatsApp.' });
    } catch (err) {
        console.error(`[Portal API Error: request-password]`, err.message);
        return res.status(500).json({ error: 'Server Error: ' + err.message });
    }
}

async function handleRecordLogin(req, res) {
    const { phone } = req.body;
    const { error } = await supabase.from('leads').update({ last_login: new Date().toISOString() }).eq('phone', phone);
    if (error) throw error;
    return res.status(200).json({ success: true });
}

async function handleUnlock(req, res) {
    const { phone } = req.body;
    const { data, error } = await supabase.from('leads').update({ portal_unlocked: true }).eq('phone', phone).select();
    if (error) throw error;
    return res.status(200).json({ success: true, lead: data[0] });
}
