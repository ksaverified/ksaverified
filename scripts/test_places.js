
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function testPlaces() {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    try {
        console.log('Testing Google Places API...');
        const response = await axios.post(url, {
            textQuery: 'barbershop in Riyadh'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.id,places.displayName',
                'Referer': 'https://ksaverified.com'
            }
        });
        console.log('Success! Found:', response.data.places?.length, 'places');
    } catch (error) {
        console.error('Places API Failed:', error.response?.status, error.response?.data || error.message);
    }
}

testPlaces();
