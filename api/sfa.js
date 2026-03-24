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
            case 'get-profile':
                return await handleGetProfile(req, res);
            case 'request-withdrawal':
                return await handleRequestWithdrawal(req, res);
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
    let { place_id, salesman_id } = req.body;
    
    // Convert 'default' to a valid UUID to avoid Postgres type errors
    if (salesman_id === 'default') {
        salesman_id = '00000000-0000-0000-0000-000000000000';
    }

    const { data, error } = await supabase.from('leads').update({ 
        claimed_by: salesman_id, 
        claimed_at: new Date().toISOString() 
    }).eq('place_id', place_id).is('claimed_by', null).select();
    if (error) throw error;
    if (data.length === 0) return res.status(409).json({ success: false, message: 'Already claimed' });
    return res.status(200).json({ success: true, message: 'Claimed' });
}

async function handleLogVisit(req, res) {
    let { place_id, salesman_id, result, notes, photo_url, lat, lng } = req.body;
    
    // Normalize salesman_id
    if (salesman_id === 'default') salesman_id = '00000000-0000-0000-0000-000000000000';

    // 1. Fetch commission rates
    const { data: settingsData } = await supabase.from('settings').select('value').eq('key', 'commission_rates').single();
    const rates = settingsData?.value || { trial_conversion_sar: 10, subscription_conversion_sar: 50 };
    
    let commission = 0;
    if (result === 'success') {
        commission = rates.trial_conversion_sar; // Default to trial conversion for now
    }

    // 2. Insert visit
    const { error: visitError } = await supabase.from('visits').insert({ 
        lead_id: place_id, 
        salesman_id, 
        result, 
        notes, 
        photo_url, 
        lat, 
        lng,
        commission_earned: commission
    });
    if (visitError) throw visitError;

    // 3. Update salesman balance if commission earned
    if (commission > 0) {
        // Atomic-ish update for balance
        const { data: salesman } = await supabase.from('salesmen').select('balance, total_earned').eq('id', salesman_id).single();
        if (salesman) {
            await supabase.from('salesmen').update({ 
                balance: (Number(salesman.balance) || 0) + commission,
                total_earned: (Number(salesman.total_earned) || 0) + commission,
                updated_at: new Date().toISOString()
            }).eq('id', salesman_id);
        }
    }

    // 4. Update lead status
    let newStatus = 'scouted';
    if (result === 'success') newStatus = 'interest_confirmed';
    else if (result === 'followup') newStatus = 'warmed';
    else if (result === 'rejected') newStatus = 'rejected';
    
    const { error: leadError } = await supabase.from('leads').update({ 
        status: newStatus, 
        updated_at: new Date().toISOString() 
    }).eq('place_id', place_id);
    
    if (leadError) throw leadError;
    return res.status(200).json({ success: true, status: newStatus, commission });
}

async function handleGetProfile(req, res) {
    let { salesman_id } = req.query;
    if (salesman_id === 'default') salesman_id = '00000000-0000-0000-0000-000000000000';

    // Fetch salesman basic info
    const { data: profile, error: profileError } = await supabase.from('salesmen').select('*').eq('id', salesman_id).single();
    if (profileError) throw profileError;

    // Fetch visit count
    const { count: visitCount } = await supabase.from('visits').select('*', { count: 'exact', head: true }).eq('salesman_id', salesman_id);
    
    // Fetch claim count
    const { count: claimCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('claimed_by', salesman_id);

    // Fetch recent withdrawals
    const { data: withdrawals } = await supabase.from('withdrawal_requests').select('*').eq('salesman_id', salesman_id).order('created_at', { ascending: false }).limit(10);

    return res.status(200).json({ 
        success: true, 
        profile: {
            ...profile,
            stats: {
                total_visits: visitCount || 0,
                total_claims: claimCount || 0,
                total_earned: profile.total_earned || 0,
                current_balance: profile.balance || 0
            },
            withdrawals: withdrawals || []
        } 
    });
}

async function handleRequestWithdrawal(req, res) {
    let { salesman_id, amount } = req.body;
    if (salesman_id === 'default') salesman_id = '00000000-0000-0000-0000-000000000000';
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    // 1. Verify balance
    const { data: salesman, error: fetchError } = await supabase.from('salesmen').select('balance').eq('id', salesman_id).single();
    if (fetchError || !salesman) return res.status(404).json({ error: 'Salesman not found' });

    if (salesman.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }

    // 2. Create withdrawal request
    const { data: withdrawal, error: withdrawError } = await supabase.from('withdrawal_requests').insert({
        salesman_id,
        amount,
        status: 'pending'
    }).select().single();
    if (withdrawError) throw withdrawError;

    // 3. Deduct from balance
    await supabase.from('salesmen').update({ 
        balance: Number(salesman.balance) - amount,
        updated_at: new Date().toISOString()
    }).eq('id', salesman_id);

    return res.status(200).json({ success: true, withdrawal });
}
