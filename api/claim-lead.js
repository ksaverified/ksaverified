const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { place_id, salesman_id } = req.body;

    if (!place_id || !salesman_id) {
        return res.status(400).json({ error: 'place_id and salesman_id are required' });
    }

    try {
        // Atomic update to claim the lead ONLY if it's not already claimed
        const { data, error } = await supabase
            .from('leads')
            .update({ 
                claimed_by: salesman_id, 
                claimed_at: new Date().toISOString() 
            })
            .eq('place_id', place_id)
            .is('claimed_by', null)
            .select();

        if (error) throw error;

        if (data.length === 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'Lead already claimed by another agent.' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Lead claimed successfully for 24 hours.'
        });
    } catch (error) {
        console.error('[API Claim Lead Error]', error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
