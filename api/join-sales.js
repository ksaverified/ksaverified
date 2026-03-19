const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, phone, email } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and Phone are required' });
    }

    try {
        // Register the salesman
        const { data, error } = await supabase
            .from('salesmen')
            .upsert({ 
                name, 
                phone, 
                email,
                status: 'active',
                updated_at: new Date().toISOString()
            }, { onConflict: 'phone' })
            .select();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: 'Salesman registered successfully.',
            salesman: data[0]
        });
    } catch (error) {
        console.error('[API Join Sales Error]', error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
