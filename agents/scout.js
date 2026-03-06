const axios = require('axios');

/**
 * Scout Agent
 * Queries Google Places API to find local businesses that have a phone number but no website.
 */
class ScoutAgent {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY is not defined in environment variables.');
    }
  }

  /**
   * Search for businesses matching a query
   * @param {string} query - The search query (e.g., "restaurant in Riyadh")
   * @returns {Promise<Array>} List of businesses meeting criteria
   */
  async findLeads(query) {
    console.log(`[Scout] Searching for leads with query: "${query}"...`);

    try {
      let validLeads = [];
      let nextPageToken = null;
      let pagesFetched = 0;
      const maxPages = 3;

      do {
        // Step 1: Text Search to get a list of places
        let searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
        if (nextPageToken) {
          searchUrl += `&pagetoken=${nextPageToken}`;
          // Google requires a short delay before the next_page_token becomes valid
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const searchResponse = await axios.get(searchUrl);

        if (searchResponse.data.status !== 'OK' && searchResponse.data.status !== 'ZERO_RESULTS') {
          throw new Error(`Google Places API Error: ${searchResponse.data.status} - ${searchResponse.data.error_message || ''}`);
        }

        const places = searchResponse.data.results || [];
        console.log(`[Scout] Page ${pagesFetched + 1}: Found ${places.length} results.`);

        // Step 2: Get details for each place
        for (const place of places) {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,reviews,types,photos&key=${this.apiKey}`;
          const detailsResponse = await axios.get(detailsUrl);

          if (detailsResponse.data.status === 'OK') {
            const details = detailsResponse.data.result;

            if (details.formatted_phone_number && !details.website) {
              console.log(`[Scout] Found match: ${details.name} (Phone: ${details.formatted_phone_number})`);

              const topReviews = details.reviews
                ? details.reviews.filter(r => r.rating >= 4).slice(0, 3).map(r => r.text)
                : [];

              const photos = details.photos
                ? details.photos.slice(0, 5).map(p => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${p.photo_reference}&key=${this.apiKey}`)
                : [];

              validLeads.push({
                placeId: place.place_id,
                name: details.name,
                phone: details.formatted_phone_number,
                address: place.formatted_address,
                location: place.geometry?.location,
                types: details.types || [],
                reviews: topReviews,
                photos: photos
              });
            }
          }
        }

        nextPageToken = searchResponse.data.next_page_token;
        pagesFetched++;

      } while (nextPageToken && pagesFetched < maxPages);

      console.log(`[Scout] Finished scouting. Found ${validLeads.length} valid leads across ${pagesFetched} pages.`);
      return validLeads;
    } catch (error) {
      console.error(`[Scout] Error during lead generation: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ScoutAgent;
