const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { place_id, salesman_id, result, notes, photo_url, lat, lng } = req.body;

    if (!place_id || !salesman_id || !result) {
        return res.status(400).json({ error: 'Missing required visit data (place_id, salesman_id, result)' });
    }

    try {
        // 1. Log the visit
        const { error: visitError } = await supabase
            .from('visits')
            .insert({
                lead_id: place_id,
                salesman_id: salesman_id,
                result: result,
                notes: notes,
                photo_url: photo_url,
                lat: lat,
                lng: lng
            });

        if (visitError) throw visitError;

        // 2. Update lead status based on result
        let newStatus = 'scouted';
        if (result === 'success') newStatus = 'interest_confirmed';
        else if (result === 'followup') newStatus = 'warmed';
        else if (result === 'rejected') newStatus = 'rejected';

        const { error: leadError } = await supabase
            .from('leads')
            .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('place_id', place_id);

        if (leadError) throw leadError;

        return res.status(200).json({
            success: true,
            message: `Visit logged. Lead status updated to ${newStatus}.`
        });
    } catch (error) {
        console.error('[API Log Visit Error]', error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
