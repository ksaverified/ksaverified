const DatabaseService = require('../core/services/db');
const ScoutAgent = require('../core/agents/scout');
const Orchestrator = require('../core/orchestrator');

module.exports = async function handler(req, res) {
    const { action } = req.query;

    try {
        switch (action) {
            case 'lookup':
                return await handleLookup(req, res);
            case 'register':
                return await handleRegister(req, res);
            default:
                return res.status(400).json({ error: 'Invalid leads action' });
        }
    } catch (error) {
        console.error(`[Leads API Error: ${action}]`, error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

async function handleLookup(req, res) {
    const phone = req.query.phone || req.body.phone;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    const scout = new ScoutAgent();
    const place = await scout.findPlaceByPhone(phone);

    if (!place) {
        return res.status(404).json({ 
            success: false, 
            message: 'No business found on Google Maps for this phone number.' 
        });
    }

    return res.status(200).json({ success: true, data: place });
}

async function handleRegister(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { businessData } = req.body;
    if (!businessData || !businessData.phone || !businessData.name) {
        return res.status(400).json({ error: 'Incomplete business data' });
    }

    const db = new DatabaseService();
    const phoneDigits = businessData.phone.replace(/\D/g, '');
    const placeId = businessData.placeId || `manual_${phoneDigits}_${Date.now()}`;
    
    const lead = {
        placeId: placeId,
        name: businessData.name,
        phone: businessData.phone,
        address: businessData.address || 'Manual Entry',
        lat: businessData.location?.lat || 24.7136,
        lng: businessData.location?.lng || 46.6753,
        status: 'interest_confirmed',
        photos: businessData.photos || [],
        types: businessData.types || ['business'],
        reviews: businessData.reviews || []
    };

    await db.upsertLead(lead);
    await db.addLog('api', 'lead_registered_self_service', placeId, { name: lead.name }, 'success');

    const main = new Orchestrator();
    main.runPipeline().catch(err => {
        console.error('[Leads Register Trigger Error]', err);
    });

    return res.status(200).json({
        success: true,
        message: 'Lead registered and generation triggered.',
        placeId: placeId
    });
}
