const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
    const { action } = req.query;

    try {
        switch (action) {
            case 'join':
                return await handleJoin(req, res);
            case 'get-leads':
                return await handleGetLeads(req, res);
            case 'claim':
                return await handleClaim(req, res);
            case 'log-visit':
                return await handleLogVisit(req, res);
            default:
                return res.status(400).json({ error: 'Invalid SFA action' });
        }
    } catch (error) {
        console.error(`[SFA API Error: ${action}]`, error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

async function handleJoin(req, res) {
    const { name, phone, email } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and Phone are required' });
    const { data, error } = await supabase.from('salesmen').upsert({ name, phone, email, status: 'active', updated_at: new Date().toISOString() }, { onConflict: 'phone' }).select();
    if (error) throw error;
    return res.status(200).json({ success: true, salesman: data[0] });
}

async function handleGetLeads(req, res) {
    const { data, error } = await supabase.from('leads').select('place_id, name, phone, address, lat, lng, status, updated_at, claimed_by, claimed_at').or('status.eq.published,status.eq.invalid').is('claimed_by', null).order('updated_at', { ascending: false }).limit(50);
    if (error) throw error;
    const filteredLeads = data.filter(l => {
        if (!l.claimed_at) return true;
        return (new Date() - new Date(l.claimed_at)) / (1000 * 60 * 60) > 24;
    });
    return res.status(200).json({ success: true, leads: filteredLeads });
}

async function handleClaim(req, res) {
    const { place_id, salesman_id } = req.body;
    const { data, error } = await supabase.from('leads').update({ claimed_by: salesman_id, claimed_at: new Date().toISOString() }).eq('place_id', place_id).is('claimed_by', null).select();
    if (error) throw error;
    if (data.length === 0) return res.status(409).json({ success: false, message: 'Already claimed' });
    return res.status(200).json({ success: true, message: 'Claimed' });
}

async function handleLogVisit(req, res) {
    const { place_id, salesman_id, result, notes, photo_url, lat, lng } = req.body;
    const { error: visitError } = await supabase.from('visits').insert({ lead_id: place_id, salesman_id, result, notes, photo_url, lat, lng });
    if (visitError) throw visitError;
    let newStatus = 'scouted';
    if (result === 'success') newStatus = 'interest_confirmed';
    else if (result === 'followup') newStatus = 'warmed';
    else if (result === 'rejected') newStatus = 'rejected';
    const { error: leadError } = await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('place_id', place_id);
    if (leadError) throw leadError;
    return res.status(200).json({ success: true, status: newStatus });
}
