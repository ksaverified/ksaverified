require('dotenv').config();
const ScoutAgent = require('./agents/scout');

async function test() {
  const scout = new ScoutAgent();
  const phone = '0533444632';
  console.log('Testing with phone:', phone);
  
  // Try with different formats to see which one works
  const formats = [
    scout.formatSaudiPhone(phone), // +966 53 344 4632
    '0533444632',
    '+966533444632',
    '053 344 4632'
  ];

  for (const f of formats) {
    console.log(`\nTrying format: [${f}]`);
    const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber';
    const axios = require('axios');
    try {
      const response = await axios.post('https://places.googleapis.com/v1/places:searchText', {
        textQuery: f
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': fieldMask,
          'Referer': 'https://ksaverified.com'
        }
      });
      if (response.data.places && response.data.places.length > 0) {
        console.log(`SUCCESS with [${f}]: Found ${response.data.places[0].displayName.text}`);
      } else {
        console.log(`FAILED with [${f}]`);
      }
    } catch (e) {
      console.log(`ERROR with [${f}]: ${e.message}`);
    }
  }
}

test();
