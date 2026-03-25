require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const DatabaseService = require('../services/db');

async function backfill() {
    console.log('Starting lat/lng backfill for existing leads...');

    const db = new DatabaseService();
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        console.error('No GOOGLE_PLACES_API_KEY found.');
        return;
    }

    // Fetch leads where lat is null
    const { data: leads, error } = await db.supabase
        .from('leads')
        .select('*')
        .is('lat', null);

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    console.log(`Found ${leads.length} leads without coordinates.`);

    for (const lead of leads) {
        try {
            console.log(`Fetching details for place_id: ${lead.place_id}...`);
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${lead.place_id}&fields=geometry&key=${apiKey}`;
            const response = await axios.get(detailsUrl);

            if (response.data.status === 'OK' && response.data.result?.geometry?.location) {
                const { lat, lng } = response.data.result.geometry.location;

                const { error: updateError } = await db.supabase
                    .from('leads')
                    .update({ lat, lng })
                    .eq('place_id', lead.place_id);

                if (updateError) {
                    console.error(`Failed to update DB for ${lead.name}:`, updateError);
                } else {
                    console.log(`✅ Updated ${lead.name} to ${lat}, ${lng}`);
                }
            } else {
                console.log(`⚠️ Skipped ${lead.name} - could not fetch geometry.`);
            }
        } catch (e) {
            console.error(`Error processing ${lead.name}:`, e.message);
        }

        // Slight delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('Backfill complete!');
}

backfill();
