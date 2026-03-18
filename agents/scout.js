const axios = require('axios');

/**
 * Scout Agent
 * Queries Google Places API (New) to find local businesses.
 */
class ScoutAgent {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY is not defined in environment variables.');
    }
    this.baseURL = 'https://places.googleapis.com/v1/places:searchText';
  }

  /**
   * Formats a Saudi phone number for optimal lookup in Google Places API
   * @param {string} phone - Input phone number
   * @returns {string} Formatted phone (e.g., +966 5X XXX XXXX)
   */
  formatSaudiPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    let core = digits;
    
    if (digits.startsWith('966')) {
      core = digits.substring(3);
    } else if (digits.startsWith('05')) {
      core = digits.substring(1);
    } else if (digits.startsWith('5')) {
      core = digits;
    }

    // Standard Saudi mobile: 5X XXX XXXX
    if (core.length === 9) {
      return `+966 ${core.substring(0, 2)} ${core.substring(2, 5)} ${core.substring(5)}`;
    }
    
    return phone; // Fallback to original if not a standard mobile format
  }

  /**
   * Finds a place using a phone number
   * @param {string} phone - The phone number to search for
   * @returns {Promise<Object|null>} The place details or null if not found
   */
  async findPlaceByPhone(phone) {
    const formatted = this.formatSaudiPhone(phone);
    console.log(`[Scout] Searching for place by phone: [${phone}] (formatted: [${formatted}])...`);
    
    try {
      const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.websiteUri,places.internationalPhoneNumber,places.reviews,places.photos';
      
      const response = await axios.post(this.baseURL, {
        textQuery: formatted
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': fieldMask,
          'Referer': 'https://ksaverified.com'
        }
      });

      if (response.data.places && response.data.places.length > 0) {
        const place = response.data.places[0];
        console.log(`[Scout] Found place: ${place.displayName.text} (${place.id})`);
        
        const topReviews = place.reviews
          ? place.reviews.filter(r => r.rating >= 4).slice(0, 3).map(r => r.text?.text || r.originalText?.text)
          : [];

        const photos = place.photos
          ? place.photos.slice(0, 5).map(p => `https://places.googleapis.com/v1/${p.name}/media?maxwidth=800&key=${this.apiKey}`)
          : [];

        return {
          placeId: place.id,
          name: place.displayName.text,
          phone: place.internationalPhoneNumber || phone,
          address: place.formattedAddress,
          location: {
            lat: place.location?.latitude,
            lng: place.location?.longitude
          },
          website: place.websiteUri,
          types: place.types || [],
          reviews: topReviews,
          photos: photos
        };
      }
      
      console.log(`[Scout] No place found for phone: ${phone}`);
      return null;
    } catch (error) {
      console.error(`[Scout] Error in findPlaceByPhone: ${error.message}`);
      if (error.response) console.error(`[Scout] API Details: ${JSON.stringify(error.response.data)}`);
      return null;
    }
  }

  /**
   * Search for businesses matching a query using Places API (New)
   * @param {string} query - The search query (e.g., "restaurant in Riyadh")
   * @returns {Promise<Array>} List of businesses meeting criteria
   */
  async findLeads(query) {
    console.log(`[Scout] Searching for leads with query: "${query}"...`);

    try {
      const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.websiteUri,places.internationalPhoneNumber,places.reviews,places.photos';
      
      const response = await axios.post(this.baseURL, {
        textQuery: query
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': fieldMask,
          'Referer': 'https://ksaverified.com'
        }
      });

      const places = response.data.places || [];
      console.log(`[Scout] Found ${places.length} potential leads.`);

      const validLeads = places
        .filter(place => place.internationalPhoneNumber && !place.websiteUri)
        .map(place => {
          const topReviews = place.reviews
            ? place.reviews.filter(r => r.rating >= 4).slice(0, 3).map(r => r.text?.text || r.originalText?.text)
            : [];

          const photos = place.photos
            ? place.photos.slice(0, 5).map(p => `https://places.googleapis.com/v1/${p.name}/media?maxwidth=800&key=${this.apiKey}`)
            : [];

          return {
            placeId: place.id,
            name: place.displayName.text,
            phone: place.internationalPhoneNumber,
            address: place.formattedAddress,
            location: {
              lat: place.location?.latitude,
              lng: place.location?.longitude
            },
            types: place.types || [],
            reviews: topReviews,
            photos: photos
          };
        });

      console.log(`[Scout] Filtered down to ${validLeads.length} valid leads (phone, no website).`);
      return validLeads;
    } catch (error) {
      console.error(`[Scout] Error during lead generation: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ScoutAgent;
