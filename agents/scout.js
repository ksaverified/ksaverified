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
   * Search Bing organically to see if the business has a strong presence.
   * A gap is found if Bing doesn't prominently feature them or their phone.
   */
  async crossReferenceBing(name, phone) {
    try {
      const query = `${name} Riyadh`;
      const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 5000
      });

      const html = response.data.toLowerCase();
      // Only require the main recognizable parts of the name (over 3 chars) to appear
      const nameParts = name.toLowerCase().split(' ').filter(p => p.length > 3);
      
      const isMissingName = nameParts.length > 0 && !nameParts.some(part => html.includes(part));
      
      if (isMissingName) {
        return 'bing_missing'; // Means Bing organic results didn't even match their name
      }
      return 'present';
    } catch (err) {
      console.warn(`[Scout] Warning: crossReferenceBing failed for ${name} - ${err.message}`);
      return 'error';
    }
  }

  /**
   * Finds a place using a phone number
   * @param {string} phone - The phone number to search for
   * @returns {Promise<Object|null>} The place details or null if not found
   */
  async findPlaceByPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    let core = digits;
    if (digits.startsWith('966')) core = digits.substring(3);
    else if (digits.startsWith('05')) core = digits.substring(1);
    else if (digits.startsWith('5')) core = digits;

    // Try these formats in order
    const formats = [
      `+966${core}`,              // Compact: +9665XXXXXXXX
      `+966 ${core.substring(0, 2)} ${core.substring(2, 5)} ${core.substring(5)}`, // Spaced: +966 5X XXX XXXX
      `0${core}`                  // Local: 05XXXXXXXX
    ];

    for (const f of formats) {
      console.log(`[Scout] Searching for place by phone: [${phone}] (trying format: [${f}])...`);
      
      try {
        const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.websiteUri,places.internationalPhoneNumber,places.reviews,places.photos';
        
        const response = await axios.post(this.baseURL, {
          textQuery: f
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
          console.log(`[Scout] Found place: ${place.displayName.text} (${place.id}) for format [${f}]`);
          
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
      } catch (error) {
        console.error(`[Scout] Error in findPlaceByPhone with format [${f}]: ${error.message}`);
        // Continue to next format
      }
    }
    
    console.log(`[Scout] No place found for phone: ${phone} after trying all formats.`);
    return null;
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

      // 2. Resolve gaps for valid leads (via Bing organic search)
      console.log(`[Scout] Filtered down to ${validLeads.length} valid leads (phone, no website). Checking for external search engine gaps...`);
      
      // We will map in parallel since Axios organic GET is fairly lightweight, but wait for Promise.all
      const processedLeads = await Promise.all(validLeads.map(async (lead) => {
        lead.bingGap = await this.crossReferenceBing(lead.name, lead.phone);
        return lead;
      }));

      return processedLeads;
    } catch (error) {
      console.error(`[Scout] Error during lead generation: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ScoutAgent;
