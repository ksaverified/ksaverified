const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DatabaseService = require('../core/services/db');
const ScoutAgent = require('../core/agents/scout');

async function backfillGaps() {
    console.log('🚀 Starting Map Gap Backfill Service...');
    
    const db = new DatabaseService();
    const scout = new ScoutAgent();

    try {
        // 1. Fetch leads missing gap analysis
        const { data: leads, error } = await db.supabase
            .from('leads')
            .select('*')
            .is('map_gap_analysis', null)
            .limit(100); // Process in batches to avoid API limits/timeouts

        if (error) throw error;

        console.log(`[Backfill] Found ${leads.length} leads requiring analysis.`);

        if (leads.length === 0) {
            console.log('✅ All leads are already analyzed.');
            return;
        }

        for (const lead of leads) {
            try {
                process.stdout.write(`[Backfill] Analyzing ${lead.name}... `);
                
                // 2. Get full details from Google (needed for gaps like opening hours/photos)
                const placeDetails = await scout.getPlaceDetails(lead.place_id);
                
                if (!placeDetails || !placeDetails.places || placeDetails.places.length === 0) {
                    console.log('⚠️ Failed to fetch place details.');
                    continue;
                }

                const place = placeDetails.places[0];

                // 3. Run Map Gap Analysis
                const { gaps, scores, gapCount } = await scout.analyzeMapGaps(place);
                const reviewAnalysis = scout.analyzeReviews(place.reviews);
                
                // 4. Transform to the format expected by upsertLead
                const analyzedLead = {
                    ...lead,
                    placeId: lead.place_id,
                    location: { lat: lead.lat, lng: lead.lng },
                    rating: place.rating,
                    reviewCount: place.userRatingCount || 0,
                    website: place.websiteUri,
                    openingHours: place.regularOpeningHours?.weekdayDescriptions,
                    mapGapAnalysis: {
                        gaps,
                        scores,
                        gapCount,
                        reviewAnalysis,
                        conversionScore: scores.conversionScore,
                        gbpCompleteness: scores.gbpCompleteness,
                        priorityLevel: scout.calculatePriority(gapCount, scores.conversionScore, reviewAnalysis)
                    }
                };

                // 5. Update DB
                await db.upsertLead(analyzedLead);
                await db.addLog('scout', 'backfill_gap_analysis', lead.place_id, { gaps: gapCount, score: scores.conversionScore }, 'success');
                
                console.log(`✅ Success (Score: ${scores.conversionScore})`);
                
                // Subtle delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                console.log(`❌ Error: ${err.message}`);
            }
        }

        console.log('🏁 Batch complete. Run again for next batch.');

    } catch (err) {
        console.error('💥 Critical Backfill Error:', err.message);
    }
}

backfillGaps();
