const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GOOGLE_PLACES_API_KEY;
const query = 'restaurant in Riyadh';

async function testLegacyTextSearch(q) {
  console.log(`Testing Legacy Text Search with: ${q}`);
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${apiKey}`;
  try {
    const response = await axios.get(url);
    console.log(`Status: ${response.data.status}`);
    if (response.data.error_message) {
      console.log(`Error Message: ${response.data.error_message}`);
    }
    return response.data.status;
  } catch (e) {
    console.error(`Error: ${e.message}`);
    return 'ERROR';
  }
}

testLegacyTextSearch(query);
