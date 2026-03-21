const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
    const { action } = req.query;

    try {
        switch (action) {
            case 'request-password':
                // Debug log for production
                console.log(`[Portal] Body type: ${typeof req.body}, Content-Type: ${req.headers['content-type']}`);
                return await handleRequestPassword(req, res);
            case 'record-login':
                return await handleRecordLogin(req, res);
            case 'unlock':
                return await handleUnlock(req, res);
            case 'get-website-config':
                return await handleGetWebsiteConfig(req, res);
            case 'update-website-config':
                return await handleUpdateWebsiteConfig(req, res);
            default:
                return res.status(400).json({ error: 'Invalid portal action' });
        }
    } catch (error) {
        console.error(`[Portal API Error: ${action}]`, error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

async function handleRequestPassword(req, res) {
    let body = req.body;
    
    // Handle cases where body might be a string (depending on environment/headers)
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            console.error('[Portal] Failed to parse body string:', body);
        }
    }

    if (!body) {
        return res.status(400).json({ error: 'Request body is missing' });
    }

    const { phone } = body;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    
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
        // Temporarily hardcoded for immediate stability due to Vercel env propagation lag
        const waUrl = 'https://adelaida-ferulaceous-hypsometrically.ngrok-free.dev';
        
        console.log(`[Portal] Sending PIN to ${waUrl}/send for phone ${formattedPhone}`);
        
        const message = `Hello ${lead.name}!\n\nYour secure KSA Verified Customer Portal login code is: *${registrationData.pin}*\n\nPlease enter this code to sign in.\n\n---\nمرحباً ${lead.name}!\n\nرمز تسجيل الدخول الآمن الخاص بك لبوابة عملاء KSA Verified هو: *${registrationData.pin}*\n\nيرجى إدخال هذا الرمز لتسجيل الدخول.`;
        
        try {
            const waRes = await axios.post(`${waUrl}/send`, { to: formattedPhone, message: message });
            console.log(`[Portal] WhatsApp Service response:`, waRes.data);
        } catch (waErr) {
            console.error(`[Portal] WhatsApp Service ERROR:`, waErr.response?.data || waErr.message);
            throw new Error(`WhatsApp Service failed: ${waErr.message}`);
        }

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

async function handleGetWebsiteConfig(req, res) {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone is required' });

    const { data: lead, error } = await supabase
        .from('leads')
        .select('website_config, website_html, name, address, phone')
        .eq('phone', phone)
        .single();

    if (error || !lead) return res.status(404).json({ error: 'Lead not found' });

    // Initialize default config if empty
    let config = lead.website_config;
    if (!config || Object.keys(config).length === 0) {
        console.log(`[Portal] Config for ${phone} is empty. Attempting to extract from HTML...`);
        
        const PatcherService = require('../services/patcher');
        const patcher = new PatcherService();

        // 1. Try to extract from HTML using the PatcherService
        if (lead.website_html) {
            const extracted = await patcher.extractConfig(lead.website_html);
            if (extracted) {
                config = extracted;
                // Save it immediately so next time is faster
                await supabase.from('leads').update({ website_config: config }).eq('phone', phone);
            }
        }

        // 2. Fallback to basic defaults if extraction fails or no HTML
        if (!config || Object.keys(config).length === 0) {
            config = {
                en: { title: lead.name, subtitle: '', hero_text: '', about: '', services: [], testimonials: [] },
                ar: { title: lead.name, subtitle: '', hero_text: '', about: '', services: [], testimonials: [] },
                contact: { phone: lead.phone, email: '', address: lead.address, google_maps_iframe: '' },
                photos: { hero: '', about: '' }
            };
        }
    }

    return res.status(200).json({ success: true, config });
}

async function handleUpdateWebsiteConfig(req, res) {
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { }
    }

    const { phone, config } = body;
    if (!phone || !config) return res.status(400).json({ error: 'Phone and configuration are required' });

    try {
        // 1. Fetch current lead data
        const { data: lead, error: fetchError } = await supabase
            .from('leads')
            .select('website_html')
            .eq('phone', phone)
            .single();

        if (fetchError || !lead) return res.status(404).json({ error: 'Lead not found' });

        // 2. Patch the HTML if we have it
        let updatedHtml = lead.website_html;
        if (updatedHtml) {
            const PatcherService = require('../services/patcher');
            const patcher = new PatcherService();
            updatedHtml = await patcher.patchHtml(updatedHtml, config);
        }

        // 3. Update the database
        const { error: updateError } = await supabase
            .from('leads')
            .update({ 
                website_config: config,
                website_html: updatedHtml,
                updated_at: new Date().toISOString()
            })
            .eq('phone', phone);

        if (updateError) throw updateError;

        return res.status(200).json({ success: true, message: 'Website updated successfully' });
    } catch (err) {
        console.error('[Portal] Update config error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
