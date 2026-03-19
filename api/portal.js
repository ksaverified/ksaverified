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
    // Implementation logic from request-client-password.js
    // For now, simple mock or direct Supabase check
    const { data, error } = await supabase.from('leads').select('name').eq('phone', phone).single();
    if (error || !data) return res.status(404).json({ error: 'Lead not found' });
    return res.status(200).json({ success: true, message: 'Password reset link sent (Simulated)' });
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
