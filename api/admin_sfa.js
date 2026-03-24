const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
    const { action } = req.query;

    try {
        switch (action) {
            case 'get-sales-team':
                return await handleGetSalesTeam(req, res);
            case 'get-withdrawals':
                return await handleGetWithdrawals(req, res);
            case 'process-withdrawal':
                return await handleProcessWithdrawal(req, res);
            default:
                return res.status(400).json({ error: 'Invalid Admin SFA action' });
        }
    } catch (error) {
        console.error(`[Admin SFA API Error: ${action}]`, error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

async function handleGetSalesTeam(req, res) {
    // 1. Fetch all salesmen
    const { data: salesmen, error: salesmenError } = await supabase.from('salesmen').select('*').order('created_at', { ascending: false });
    if (salesmenError) throw salesmenError;

    // 2. Fetch aggregate stats for each salesman (claims, visits)
    const salesmenWithStats = await Promise.all(salesmen.map(async (s) => {
        const { count: claims } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('claimed_by', s.id);
        const { count: visits } = await supabase.from('visits').select('*', { count: 'exact', head: true }).eq('salesman_id', s.id);
        
        return {
            ...s,
            stats: {
                claims: claims || 0,
                visits: visits || 0
            }
        };
    }));

    return res.status(200).json({ success: true, team: salesmenWithStats });
}

async function handleGetWithdrawals(req, res) {
    const { status } = req.query;
    let query = supabase.from('withdrawal_requests').select('*, salesmen(name, phone)').order('created_at', { ascending: false });
    
    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, withdrawals: data });
}

async function handleProcessWithdrawal(req, res) {
    const { id, status } = req.body; // status: 'completed' or 'rejected'
    if (!['completed', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const { data, error } = await supabase.from('withdrawal_requests').update({ 
        status, 
        updated_at: new Date().toISOString() 
    }).eq('id', id).select().single();
    
    if (error) throw error;

    // If rejected, we might want to refund the balance? 
    // The implementation plan says "Withdraw" deducts immediately.
    // If rejected, we should add it back.
    if (status === 'rejected') {
        const { data: salesman } = await supabase.from('salesmen').select('balance').eq('id', data.salesman_id).single();
        if (salesman) {
            await supabase.from('salesmen').update({ 
                balance: (Number(salesman.balance) || 0) + Number(data.amount),
                updated_at: new Date().toISOString()
            }).eq('id', data.salesman_id);
        }
    }

    return res.status(200).json({ success: true, withdrawal: data });
}
