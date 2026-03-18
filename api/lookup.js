const ScoutAgent = require('../agents/scout');

module.exports = async function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const phone = request.query.phone || request.body.phone;

  if (!phone) {
    return response.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const scout = new ScoutAgent();
    const place = await scout.findPlaceByPhone(phone);

    if (!place) {
      return response.status(404).json({ 
        success: false, 
        message: 'No business found on Google Maps for this phone number.' 
      });
    }

    return response.status(200).json({
      success: true,
      data: place
    });
  } catch (error) {
    console.error('[API Lookup Error]', error.message);
    return response.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
