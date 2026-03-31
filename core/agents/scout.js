const axios = require('axios');

/**
 * Scout Agent
 * Finds local businesses using Google Places API and performs comprehensive "Map Gap" analysis.
 * Based on the Map Gap System methodology for agency client acquisition.
 */
class ScoutAgent {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY is not defined in environment variables.');
    }
    this.baseURL = 'https://places.googleapis.com/v1/places:searchText';
    this.detailsURL = 'https://places.googleapis.com/v1/places';
  }

  /**
   * Comprehensive Map Gap Analysis for a business
   * Returns detailed gaps found in their online presence
   */
  async analyzeMapGaps(place) {
    const gaps = [];
    const scores = {};

    const reviewCount = place.reviews?.length || 0;
    const rating = place.rating || 0;
    const hasWebsite = !!place.websiteUri;
    const hasPhotos = place.photos?.length > 0;
    const hasOpeningHours = !!place.openingHours;
    const hasDescription = !!place.shortFormattedAddress;
    const regularOpeningHours = place.regularOpeningHours?.weekdayDescriptions;
    
    const totalFields = 6;
    let filledFields = 0;

    // 1. Website Gap
    if (!hasWebsite) {
      gaps.push({ type: 'no_website', severity: 'high', description: 'No website linked in Google listing' });
      scores.websiteScore = 0;
    } else {
      scores.websiteScore = 100;
      filledFields++;
    }

    // 2. Reviews Gap - Low review count (below 20 is considered low for most businesses)
    if (reviewCount < 20) {
      gaps.push({ type: 'low_reviews', severity: reviewCount < 5 ? 'high' : 'medium', 
        description: `Only ${reviewCount} reviews (competitors often have 50-200+)`, 
        current: reviewCount });
      scores.reviewScore = Math.min(100, (reviewCount / 20) * 100);
    } else {
      scores.reviewScore = 100;
      filledFields++;
    }

    // 3. Photos Gap - No business photos
    if (!hasPhotos) {
      gaps.push({ type: 'no_photos', severity: 'medium', description: 'No business photos on Google listing' });
      scores.photosScore = 0;
    } else {
      scores.photosScore = 100;
      filledFields++;
    }

    // 4. Hours Gap - Missing opening hours
    if (!hasOpeningHours || !regularOpeningHours || regularOpeningHours.length === 0) {
      gaps.push({ type: 'no_hours', severity: 'medium', description: 'Business hours not listed' });
      scores.hoursScore = 0;
    } else {
      scores.hoursScore = 100;
      filledFields++;
    }

    // 5. Google Business Profile Completeness Score
    scores.gbpCompleteness = Math.round((filledFields / totalFields) * 100);

    // 6. Calculate Overall Conversion Score (0-100)
    // Weighted: Website 30%, Reviews 35%, Photos 15%, Hours 20%
    scores.conversionScore = Math.round(
      (scores.websiteScore * 0.30) +
      (scores.reviewScore * 0.35) +
      (scores.photosScore * 0.15) +
      (scores.hoursScore * 0.20)
    );

    return { gaps, scores, gapCount: gaps.length };
  }

  /**
   * Get detailed place information including reviews, photos, hours
   */
  async getPlaceDetails(placeId) {
    try {
      const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.websiteUri,places.internationalPhoneNumber,places.reviews,places.photos,places.regularOpeningHours,places.rating,places.userRatingCount';
      
      const response = await axios.get(`${this.detailsURL}/${placeId}`, {
        headers: {
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': fieldMask
        }
      });

      return response.data;
    } catch (error) {
      console.error(`[Scout] Error getting place details for ${placeId}: ${error.message}`);
      return null;
    }
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
        return { status: 'missing', description: 'Business not found on Bing organic results' };
      }
      return { status: 'present', description: 'Business found on Bing' };
    } catch (err) {
      console.warn(`[Scout] Warning: crossReferenceBing failed for ${name} - ${err.message}`);
      return { status: 'error', description: 'Bing check failed' };
    }
  }

  /**
   * Check Yelp for NAP (Name, Address, Phone) consistency
   */
  async checkYelpConsistency(name, address) {
    try {
      const query = `${name} Riyadh`;
      const url = `https://www.yelp.com/search?find_desc=${encodeURIComponent(query)}&find_loc=Riyadh`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 5000
      });
      const html = response.data.toLowerCase();
      const nameParts = name.toLowerCase().split(' ').filter(p => p.length > 3);
      const nameMatch = nameParts.length > 0 && nameParts.some(part => html.includes(part));
      return { consistent: nameMatch, description: nameMatch ? 'Found on Yelp' : 'Not found on Yelp' };
    } catch (err) {
      return { consistent: false, description: 'Yelp check failed' };
    }
  }

  /**
   * Analyze review quality and recency
   */
  analyzeReviews(reviews) {
    if (!reviews || reviews.length === 0) {
      return { avgRating: 0, recentCount: 0, totalCount: 0, responseRate: 0 };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    const ratings = reviews.map(r => r.rating || 0);
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    
    const recentReviews = reviews.filter(r => {
      const reviewDate = new Date(r.publishTime || r.relativePublishTimeDescription || now);
      return reviewDate > thirtyDaysAgo;
    });

    const reviewsWithResponses = reviews.filter(r => r.reply && r.reply.text);
    const responseRate = reviews.length > 0 
      ? Math.round((reviewsWithResponses.length / reviews.length) * 100) 
      : 0;

    return {
      avgRating: Math.round(avgRating * 10) / 10,
      recentCount: recentReviews.length,
      totalCount: reviews.length,
      responseRate,
      gapAnalysis: {
        lowCount: reviews.length < 20,
        noRecent: recentReviews.length === 0,
        noResponses: responseRate < 10,
        lowRating: avgRating < 4.0
      }
    };
  }

  /**
   * Check if business has an outdated website (built pre-2020)
   */
  async checkWebsiteModernity(websiteUri) {
    if (!websiteUri) {
      return { isModern: false, description: 'No website to check', age: 'unknown' };
    }

    try {
      const response = await axios.get(websiteUri, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = response.data.toLowerCase();
      
      // Check for modern indicators
      const modernIndicators = [
        /react|vue|next\.js|nuxt|gatsby|angular/i,
        /tailwindcss|bootstrap \d|bulma/i,
        /fonts\.googleapis|fonts\.gstatic/i,
        /cloudflare|vercel|netlify/i,
        /lazy-load|intersectionobserver/i
      ];
      
      const outdatedIndicators = [
        /jquery/i,
        /bootstrap \d\.\d(?!\d)/i,
        /frontpage|webexpression/i,
        /angelfire|geocities|webs\.com/i
      ];

      const hasModern = modernIndicators.some(regex => regex.test(html));
      const hasOutdated = outdatedIndicators.some(regex => regex.test(html));

      if (hasOutdated) {
        return { isModern: false, description: 'Website appears outdated (pre-2020)', age: 'legacy' };
      } else if (hasModern) {
        return { isModern: true, description: 'Website uses modern tech stack', age: 'modern' };
      }
      
      return { isModern: true, description: 'Website appears functional', age: 'unknown' };
    } catch (err) {
      return { isModern: false, description: 'Could not analyze website', age: 'error' };
    }
  }

  /**
   * Finds a place using a phone number with comprehensive gap analysis
   * @param {string} phone - The phone number to search for
   * @returns {Promise<Object|null>} The place details or null if not found
   */
  async findPlaceByPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    let core = digits;
    if (digits.startsWith('966')) core = digits.substring(3);
    else if (digits.startsWith('05')) core = digits.substring(1);
    else if (digits.startsWith('5')) core = digits;

    const formats = [
      `+966${core}`,
      `+966 ${core.substring(0, 2)} ${core.substring(2, 5)} ${core.substring(5)}`,
      `0${core}`
    ];

    for (const f of formats) {
      console.log(`[Scout] Searching for place by phone: [${phone}] (trying format: [${f}])...`);
      
      try {
        const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.websiteUri,places.internationalPhoneNumber,places.reviews,places.photos,places.regularOpeningHours,places.rating,places.userRatingCount';
        
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
          
          const { gaps, scores, gapCount } = await this.analyzeMapGaps(place);
          const reviewAnalysis = this.analyzeReviews(place.reviews);
          const bingResult = await this.crossReferenceBing(place.displayName.text, place.internationalPhoneNumber || phone);

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
            photos: photos,
            rating: place.rating,
            reviewCount: place.userRatingCount || 0,
            openingHours: place.regularOpeningHours?.weekdayDescriptions,
            // Map Gap Analysis
            mapGapAnalysis: {
              gaps,
              scores,
              gapCount,
              reviewAnalysis,
              bingStatus: bingResult.status,
              priorityLevel: this.calculatePriority(gapCount, scores.conversionScore, reviewAnalysis)
            }
          };
        }
      } catch (error) {
        console.error(`[Scout] Error in findPlaceByPhone with format [${f}]: ${error.message}`);
      }
    }
    
    console.log(`[Scout] No place found for phone: ${phone} after trying all formats.`);
    return null;
  }

  /**
   * Calculate lead priority based on gap analysis
   */
  calculatePriority(gapCount, conversionScore, reviewAnalysis) {
    if (gapCount >= 4 && conversionScore < 30) return 'hot';
    if (gapCount >= 2 && conversionScore < 50) return 'warm';
    if (reviewAnalysis?.lowCount) return 'warm';
    return 'cold';
  }

  /**
   * Search for businesses matching a query using Places API (New) with Map Gap Analysis
   * @param {string} query - The search query (e.g., "restaurant in Riyadh")
   * @returns {Promise<Array>} List of businesses with comprehensive gap analysis
   */
  async findLeads(query) {
    console.log(`[Scout] Searching for leads with query: "${query}"...`);

    try {
      const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.websiteUri,places.internationalPhoneNumber,places.reviews,places.photos,places.regularOpeningHours,places.rating,places.userRatingCount';
      
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
      console.log(`[Scout] Found ${places.length} potential leads. Processing with Map Gap analysis...`);

      // Process all leads with gap analysis
      const processedLeads = await Promise.all(places.map(async (place) => {
        // Filter: Must have phone number for WhatsApp outreach
        if (!place.internationalPhoneNumber) return null;

        // Run gap analysis
        const { gaps, scores, gapCount } = await this.analyzeMapGaps(place);
        const reviewAnalysis = this.analyzeReviews(place.reviews);
        const bingResult = await this.crossReferenceBing(place.displayName.text, place.internationalPhoneNumber);
        const yelpResult = await this.checkYelpConsistency(place.displayName.text, place.formattedAddress);
        
        let websiteAnalysis = { isModern: true };
        if (place.websiteUri) {
          websiteAnalysis = await this.checkWebsiteModernity(place.websiteUri);
        }

        const topReviews = place.reviews
          ? place.reviews.filter(r => r.rating >= 4).slice(0, 3).map(r => r.text?.text || r.originalText?.text)
          : [];

        const photos = place.photos
          ? place.photos.slice(0, 5).map(p => `https://places.googleapis.com/v1/${p.name}/media?maxwidth=800&key=${this.apiKey}`)
          : [];

        const lead = {
          placeId: place.id,
          name: place.displayName.text,
          phone: place.internationalPhoneNumber,
          address: place.formattedAddress,
          location: {
            lat: place.location?.latitude,
            lng: place.location?.longitude
          },
          website: place.websiteUri,
          websiteAnalysis,
          types: place.types || [],
          reviews: topReviews,
          photos: photos,
          rating: place.rating,
          reviewCount: place.userRatingCount || 0,
          openingHours: place.regularOpeningHours?.weekdayDescriptions,
          // External presence checks
          externalPresence: {
            bing: bingResult,
            yelp: yelpResult
          },
          // Comprehensive Map Gap Analysis
          mapGapAnalysis: {
            gaps,
            scores,
            gapCount,
            reviewAnalysis,
            conversionScore: scores.conversionScore,
            gbpCompleteness: scores.gbpCompleteness,
            priorityLevel: this.calculatePriority(gapCount, scores.conversionScore, reviewAnalysis)
          }
        };

        // Add outdated website gap if detected
        if (place.websiteUri && !websiteAnalysis.isModern) {
          lead.mapGapAnalysis.gaps.push({
            type: 'outdated_website',
            severity: 'medium',
            description: 'Website appears outdated',
            recommendation: 'Modern website would improve credibility'
          });
        }

        return lead;
      }));

      // Filter out nulls and sort by priority
      const validLeads = processedLeads
        .filter(lead => lead !== null)
        .sort((a, b) => {
          const priorityOrder = { hot: 0, warm: 1, cold: 2 };
          return (priorityOrder[a.mapGapAnalysis.priorityLevel] || 2) - 
                 (priorityOrder[b.mapGapAnalysis.priorityLevel] || 2);
        });

      console.log(`[Scout] Processed ${validLeads.length} leads with Map Gap analysis.`);
      console.log(`[Scout] Priority breakdown: Hot=${validLeads.filter(l => l.mapGapAnalysis.priorityLevel === 'hot').length}, Warm=${validLeads.filter(l => l.mapGapAnalysis.priorityLevel === 'warm').length}, Cold=${validLeads.filter(l => l.mapGapAnalysis.priorityLevel === 'cold').length}`);

      return validLeads;
    } catch (error) {
      console.error(`[Scout] Error during lead generation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate outreach message based on Map Gap findings
   * Follows the Map Gap System methodology: specific, positive first, no hard ask
   */
  generateMapGapMessage(lead, messageType = 'initial') {
    const { gaps, conversionScore, priorityLevel } = lead.mapGapAnalysis;
    const hasWebsite = lead.website && lead.website.length > 0;
    const hasReviews = lead.reviewCount > 0;

    if (messageType === 'initial_warm') {
      if (!hasWebsite) {
        // No website message
        return {
          en: `Hi ${lead.name} team! 👋

I was trying to find your website when searching for ${lead.types[0] || 'businesses'} in Riyadh, but I couldn't find one.

I know that's probably not at the top of your priority list when you're busy actually running your business, but it might be costing you more customers than you think.

Happy to share what I found if you're open to it.

Best,
KSA Verified Team`,
          ar: `مرحباً فريق ${lead.name}! 👋

كنت أحاول البحث عن موقعكم الإلكتروني عند البحث عن ${lead.types[0] || 'الأعمال'} في الرياض، لكنني لم أجد واحداً.

أعلم أن هذا ربما ليس في أعلى قائمة أولوياتكم وأنتم مشغولون بإدارة عملكم، لكنه قد يكلفكم عملاء أكثر مما تظنون.

يسعدني مشاركة ما وجدته معكم إذا كنتم منفتحين على ذلك.

مع أطيب التحيات،
فريق KSA Verified`
        };
      } else {
        // Has website but has gaps
        const noReviews = lead.reviewCount < 10;
        const lowReviews = lead.reviewCount < 20;
        
        let observation = '';
        if (noReviews) {
          observation = "I noticed your Google listing doesn't have any reviews yet";
        } else if (lowReviews) {
          observation = `Your business has ${lead.reviewCount} reviews, while competitors in your area often have 50+`;
        } else {
          observation = "I noticed a few things on your Google listing that could be affecting your visibility";
        }

        return {
          en: `Hi ${lead.name} team! 👋

I was searching for ${lead.types[0] || 'businesses'} in Riyadh and came across your business. You've got some solid ${hasReviews ? 'reviews' : 'potential'}!

${observation}. I put together a quick breakdown if you'd like to see it. No charge, no strings. Just thought it might help.

Best,
KSA Verified Team`,
          ar: `مرحباً فريق ${lead.name}! 👋

كنت أبحث عن ${lead.types[0] || 'الأعمال'} في الرياض وعثرت على أعمالكم. لديكم بعض ${hasReviews ? 'التقييمات الجيدة' : 'الإمكانات'}!

${observation}. أعددت ملخصاً سريعاً إذا أحببتم رؤيته. بدون رسوم، بدون التزامات. فقط ظننت أنه قد يساعد.

مع أطيب التحيات،
فريق KSA Verified`
        };
      }
    }

    // Default message for follow-ups
    return {
      en: `Hi ${lead.name} team! 💎 Just following up on my earlier message. Did you get a chance to look at what I found?

Happy to answer any questions!

Best,
KSA Verified Team`,
      ar: `مرحباً فريق ${lead.name}! 💎 أتبع رسالتي السابقة. هل أتيحت لكم الفرصة لرؤية ما وجدته؟

يسعدني الإجابة على أي أسئلة!

مع أطيب التحيات،
فريق KSA Verified`
    };
  }
}

module.exports = ScoutAgent;
