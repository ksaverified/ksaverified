const DatabaseService = require('../services/db');
const Orchestrator = require('../orchestrator');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { businessData } = request.body;

  if (!businessData || !businessData.phone || !businessData.name) {
    return response.status(400).json({ error: 'Incomplete business data' });
  }

  try {
    const db = new DatabaseService();
    
    // Ensure we have a placeId (generate synthetic if manual)
    const phoneDigits = businessData.phone.replace(/\D/g, '');
    const placeId = businessData.placeId || `manual_${phoneDigits}_${Date.now()}`;
    
    // Construct the lead object
    const lead = {
      placeId: placeId,
      name: businessData.name,
      phone: businessData.phone,
      address: businessData.address || 'Manual Entry',
      lat: businessData.location?.lat || 24.7136, // Default Riyadh
      lng: businessData.location?.lng || 46.6753,
      status: 'interest_confirmed', // Priority status
      photos: businessData.photos || [],
      types: businessData.types || ['business'],
      reviews: businessData.reviews || []
    };

    console.log(`[API Register] Upserting lead: ${lead.name} (${placeId})`);
    await db.upsertLead(lead);
    await db.addLog('api', 'lead_registered_self_service', placeId, { name: lead.name }, 'success');

    // Trigger Orchestrator in background
    console.log(`[API Register] Triggering orchestrator for ${lead.name}`);
    const main = new Orchestrator();
    
    // We don't await this as we want to return success to the UI immediately
    main.runPipeline().catch(err => {
      console.error('[API Register Trigger Error]', err);
    });

    return response.status(200).json({
      success: true,
      message: 'Lead registered and generation triggered.',
      placeId: placeId
    });
  } catch (error) {
    console.error('[API Register Error]', error.message);
    return response.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
