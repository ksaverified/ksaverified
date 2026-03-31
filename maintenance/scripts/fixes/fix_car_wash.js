require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const CreatorAgent = require('./agents/creator');
const RetoucherAgent = require('./agents/retoucher');
const PublisherAgent = require('./agents/publisher');
const DatabaseService = require('./services/db');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixCarWash() {
    const db = new DatabaseService();
    const creator = new CreatorAgent();
    const retoucher = new RetoucherAgent();
    const publisher = new PublisherAgent();

    const placeId = 'ChIJudd_V9PlLj4RZUzgqq0oWog';
    const name = '11:11 ELEVEN ELEVEN CAR WASH';
    
    console.log(`--- Processing [${name}] (${placeId}) ---`);
    try {
        const { data: lead, error } = await supabase.from('leads').select('*').eq('place_id', placeId).single();
        if (error || !lead) throw new Error('Could not find lead in DB');

        const business = {
            name: lead.name,
            phone: lead.phone,
            address: lead.address || 'Riyadh, Saudi Arabia',
            types: lead.types || [],
            photos: lead.photos || [],
            reviews: lead.reviews || []
        };

        // Step 1: Generate website
        console.log(`Generating website...`);
        const rawHtml = await creator.createWebsite(business, db);
        console.log(`Website generated, length: ${rawHtml.length}`);
        
        // Step 2: Retouch
        console.log('Retouching with correct photos...');
        const polishedHtml = await retoucher.retouchWebsite(rawHtml, business, lead.photos || []);
        console.log('Retouched, length:', polishedHtml.length);

        // Step 3: Save to DB
        await supabase.from('leads').update({ website_html: polishedHtml, status: 'retouched' }).eq('place_id', placeId);
        
        // Step 4: Deploy
        console.log('Deploying...');
        const deployedUrl = await publisher.handlePublish(placeId, lead.slug || business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        console.log('Deployed to:', deployedUrl);

        // Update status to published
        await supabase.from('leads').update({ status: 'published', vercel_url: deployedUrl }).eq('place_id', placeId);
        console.log('--- DONE ---');
    } catch (e) {
        console.error(`FAILED: ${e.message}`);
    }
}

fixCarWash().catch(e => console.error('FATAL:', e.message));
