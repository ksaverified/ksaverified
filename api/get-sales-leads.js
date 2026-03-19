const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Fetch leads that are either published (ready to visit) 
        // or invalid (landline gap - physical visit required)
        // and are NOT claimed by another salesman recently
        const { data, error } = await supabase
            .from('leads')
            .select('place_id, name, phone, address, lat, lng, status, updated_at, claimed_by, claimed_at')
            .or('status.eq.published,status.eq.invalid')
            .is('claimed_by', null)
            .order('updated_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Additional filter: Clear claims older than 24 hours (cleanup)
        // This would usually be a background job, but for the API we just skip them
        const filteredLeads = data.filter(l => {
            if (!l.claimed_at) return true;
            const claimedAt = new Date(l.claimed_at);
            const now = new Date();
            const diffHours = (now - claimedAt) / (1000 * 60 * 60);
            return diffHours > 24; // Re-available after 24 hours
        });

        return res.status(200).json({
            success: true,
            leads: filteredLeads
        });
    } catch (error) {
        console.error('[API Get Sales Leads Error]', error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
