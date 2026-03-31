require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const CreatorAgent = require('./agents/creator');
const RetoucherAgent = require('./agents/retoucher');
const PublisherAgent = require('./agents/publisher');
const DatabaseService = require('./services/db');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const userIDs = [
    'CHIJY1-YF44DLZ4RQZFZAGCNROG',
    'CHIJZWLQTKUELZ4RTHE24MHCE8S',
    'CHIJKATP2XQBLZ4RIOY8CVJGKYK',
    'CHIJX5H2E70CLZ4RDAFQDSSJGC8',
    'CHIJHQGX6XYDLZ4RI2ADL7WBPUS',
    'CHIJQX1BUAAFLZ4R482YC4FX4SS'
];

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    const db = new DatabaseService();
    const creator = new CreatorAgent();
    const retoucher = new RetoucherAgent();
    const publisher = new PublisherAgent();

    for (const rawId of userIDs) {
        const { data: lead, error } = await supabase.from('leads').select('*').ilike('place_id', rawId).single();
        if (error || !lead) {
            console.error('Could not find lead for raw ID:', rawId);
            continue;
        }

        const placeId = lead.place_id;
        console.log(`\n\n--- Processing [${lead.name}] (${placeId}) ---`);

        const business = {
            name: lead.name,
            phone: lead.phone,
            address: lead.address || 'Riyadh, Saudi Arabia',
            types: lead.types || [],
            photos: lead.photos || [],
            reviews: lead.reviews || []
        };

        let success = false;
        let attempts = 0;
        
        while (!success && attempts < 3) {
            attempts++;
            try {
                // Step 1: Generate website
                console.log(`Attempt ${attempts}: Generating website...`);
                const rawHtml = await creator.createWebsite(business, db);
                console.log(`Website generated, length: ${rawHtml.length}`);
                
                if (rawHtml.length < 10000) {
                     console.log('WARNING: HTML looks truncated! But we are trusting gemini-1.5-flash for now.');
                }

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
                await supabase.from('leads').update({ status: lead.status === 'invalid' ? 'published' : lead.status, vercel_url: deployedUrl }).eq('place_id', placeId);
                success = true;
            } catch (e) {
                console.error(`Attempt ${attempts} failed:`, e.message);
                if (attempts < 3) {
                    console.log('Waiting 25 seconds before retry due to Gemini rate limits...');
                    await delay(25000);
                }
            }
        }
    }
    console.log('\n--- ALL DONE ---');
}

run().catch(e => console.error('FATAL:', e.message));
